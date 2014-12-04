from totalimpactwebapp import json_sqlalchemy
from util import commit
from util import cached_property
from util import dict_from_dir
from util import as_int_or_float_if_possible
from totalimpactwebapp import db
from totalimpactwebapp.twitter_paging import TwitterPager

from birdy.twitter import AppClient, TwitterApiError, TwitterRateLimitError, TwitterClientError
from collections import defaultdict
import os
import datetime
import logging
logger = logging.getLogger('ti.tweet')

def tweets_from_tiids(tiids):
    if not tiids:
        return []
    tweets = db.session.query(Tweet).filter(Tweet.tiid.in_(tiids)).all()
    return tweets

def get_product_tweets_for_profile(profile_id):
    tweets = db.session.query(Tweet).filter(Tweet.profile_id==profile_id).all()
    response = defaultdict(list)
    for tweet in tweets:
        if tweet.tiid:
            response[tweet.tiid].append(tweet)
    return response

def save_specific_tweets(tweet_ids, max_pages=1, pager=None):

    if not pager:
        pager = TwitterPager(os.getenv("TWITTER_CONSUMER_KEY"), 
                        os.getenv("TWITTER_CONSUMER_SECRET"),
                        os.getenv("TWITTER_ACCESS_TOKEN"), 
                        default_max_pages=max_pages)

    tweet_id_string = ",".join(tweet_ids)

    def store_all_tweets(r):
        data = r.data
        if not data:
            data = []

        store_tweet_payload_from_twitter(profile_id=None, tiid=None, payload_dicts=data)

        tweet_ids_with_response = [tweet["id_str"] for tweet in data]
        tweet_ids_without_response = [tweet for tweet in tweet_ids if tweet not in tweet_ids_with_response]
        for tweet_id in tweet_ids_without_response:
            # logger.debug("deleted tweet {tweet_id}".format(
            #     tweet_id=tweet_id))
            tweet = Tweet.query.get(tweet_id)
            tweet.is_deleted = True
            db.session.add(tweet)
        commit(db)
        return True

    try:
        r = pager.paginated_search(
            page_handler=store_all_tweets,
            id=tweet_id_string,
            trim_user=False,
            query_type="statuses_lookup"
            )
    except TwitterApiError:
        logger.warning("TwitterApiError error, skipping")
    except TwitterClientError:
        logger.warning("TwitterClientError error, skipping")


def save_recent_tweets(profile_id, twitter_handle, max_pages=5, tweets_per_page=200):

    pager = TwitterPager(os.getenv("TWITTER_CONSUMER_KEY"), 
                    os.getenv("TWITTER_CONSUMER_SECRET"),
                    os.getenv("TWITTER_ACCESS_TOKEN"), 
                    default_max_pages=max_pages)

    most_recent_tweet_id = Tweet.most_recent_tweet_id(twitter_handle)

    def store_all_tweets_with_profile_id(r):
        return store_tweet_payload_from_twitter(profile_id, tiid=None, payload_dicts=r.data)

    try:
        r = pager.paginated_search(
            page_handler=store_all_tweets_with_profile_id,
            screen_name=twitter_handle, 
            count=tweets_per_page, 
            contributor_details=True, 
            include_rts=True,
            exclude_replies=False,
            trim_user=False,
            since_id=most_recent_tweet_id,
            query_type="user_timeline"            
            )
    except TwitterApiError:
        logger.warning("TwitterApiError error, skipping")
    except TwitterClientError:
        logger.warning("TwitterClientError error, skipping")



def store_tweet_payload_from_twitter(profile_id, tiid, payload_dicts):
    for payload_dict in payload_dicts:
        tweet_id = payload_dict["id_str"]
        # logger.debug("saving tweet {tweet_id}".format(
        #     tweet_id=tweet_id))
        tweet = Tweet.query.get(tweet_id)
        if tweet:
            if not tweet.payload:
                tweet.payload = payload_dict
                db.session.add(tweet)
        else:
            tweet = Tweet(profile_id=profile_id, tiid=tiid, payload=payload_dict)
            db.session.add(tweet)
    commit(db)
    num_saved_tweets = len(payload_dicts)
    return num_saved_tweets


def save_product_tweets(profile_id, tiid, twitter_posts_from_altmetric):
    tweets = db.session.query(Tweet).filter(Tweet.tiid==tiid).all()
    tweets_by_tweet_id_and_tiid = dict([((tweet.tweet_id, tweet.tiid), tweet) for tweet in tweets])
    tweeters = {}

    new_objects = []
    for post in twitter_posts_from_altmetric:
        tweet_id = post["tweet_id"]
        screen_name = post["author"]["id_on_source"]

        if (tweet_id, tiid) in tweets_by_tweet_id_and_tiid.keys():
            tweet = tweets_by_tweet_id_and_tiid[(tweet_id, tiid)]
        else:
            tweet = Tweet(tweet_id=tweet_id, tiid=tiid)

        #overwrite even if there
        tweet.set_attributes_from_post(post)
        tweet.profile_id = profile_id
        new_objects.append(tweet)

        tweeter = None
        if screen_name in tweeters.keys():
            continue  # already saved this one
        if not tweeter:
            tweeter = Tweeter(screen_name=screen_name)
        tweeters[screen_name] = tweeter

        tweeter.set_attributes_from_post(post)
        new_objects.append(tweeter)

    for obj in new_objects:
        db.session.merge(obj)
    commit(db)

    return new_objects


def save_product_tweets_for_profile(profile):
    tweets = db.session.query(Tweet).filter(Tweet.profile_id==profile.id).all()
    tweets_by_tweet_id_and_tiid = dict([((tweet.tweet_id, tweet.tiid), tweet) for tweet in tweets])
    tweeters = {}

    new_objects = []
    for product in profile.display_products:
        tiid = product.tiid
        metric = product.get_metric_by_name("altmetric_com", "posts")
        # logger.info(u"{url_slug} has tweet".format(
        #     url_slug=profile.url_slug))
        if metric and "twitter" in metric.most_recent_snap.raw_value:
            print ".",
            twitter_posts_from_altmetric = metric.most_recent_snap.raw_value["twitter"]

            for post in twitter_posts_from_altmetric:
                tweet_id = post["tweet_id"]
                screen_name = post["author"]["id_on_source"]

                if (tweet_id, tiid) in tweets_by_tweet_id_and_tiid.keys():
                    tweet = tweets_by_tweet_id_and_tiid[(tweet_id, tiid)]
                else:
                    tweet = Tweet(tweet_id=tweet_id, tiid=tiid)

                #overwrite even if there
                tweet.set_attributes_from_post(post)
                tweet.profile_id = profile.id
                new_objects.append(tweet)

                tweeter = None
                if screen_name in tweeters.keys():
                    continue  # already saved this one
                if not tweeter:
                    tweeter = Tweeter(screen_name=screen_name)
                tweeters[screen_name] = tweeter

                tweeter.set_attributes_from_post(post)
                new_objects.append(tweeter)

    for obj in new_objects:
        db.session.merge(obj)
    commit(db)
    
    return new_objects




class Tweeter(db.Model):
    screen_name = db.Column(db.Text, primary_key=True)
    followers = db.Column(db.Integer)
    name = db.Column(db.Text)
    description = db.Column(db.Text)
    image_url = db.Column(db.Text)
    last_collected_date = db.Column(db.DateTime())   #alter table tweeter add last_collected_date timestamp

    def __init__(self, **kwargs):
        if not "last_collected_date" in kwargs:
            self.last_collected_date = datetime.datetime.uctnow()
        super(Tweeter, self).__init__(**kwargs)


    def set_attributes_from_post(self, post):
        self.followers = post["author"].get("followers", 0)
        self.name = post["author"].get("name", self.screen_name)
        self.description = post["author"].get("description", "")
        self.image_url = post["author"].get("image", None)
        return self

    def __repr__(self):
        return u'<Tweet {screen_name} {followers}>'.format(
            screen_name=self.screen_name, 
            followers=self.followers)

    def to_dict(self):
        attributes_to_ignore = [
            "tweet"
        ]
        ret = dict_from_dir(self, attributes_to_ignore)
        return ret


class Tweet(db.Model):
    tweet_id = db.Column(db.Text, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    screen_name = db.Column(db.Text, db.ForeignKey('tweeter.screen_name'))
    tweet_timestamp = db.Column(db.DateTime())
    payload = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))
    tiid = db.Column(db.Text)  # alter table tweet add tiid text
    is_deleted = db.Column(db.Boolean)  # alter table tweet add is_deleted bool
    tweet_url = db.Column(db.Text) # alter table tweet add tweet_url text
    country = db.Column(db.Text) # alter table tweet add country text
    followers_at_time_of_tweet = db.Column(db.Integer) # alter table tweet add followers_at_time_of_tweet int4

    tweeter = db.relationship(
        'Tweeter',
        lazy='joined',
        cascade='all, delete-orphan',
        backref=db.backref("tweet", lazy="joined"), 
        uselist=False,  #onetoone
        single_parent=True
    )

    def __init__(self, **kwargs):
        if "payload" in kwargs:
            payload_dict = kwargs["payload"]
            kwargs["tweet_id"] = payload_dict["id_str"]
            kwargs["screen_name"] = payload_dict["user"]["screen_name"]
            kwargs["payload"] = payload_dict
            kwargs["tweet_timestamp"] = datetime.datetime.strptime(payload_dict["created_at"], r"%a %b %d %H:%M:%S +0000 %Y")
            if not "country" in kwargs:
                try:
                    kwargs["country"] = payload_dict["place"]["country_code"]            
                except (AttributeError, TypeError):
                    pass
        super(Tweet, self).__init__(**kwargs)

    @classmethod
    def most_recent_tweet_id(cls, screen_name):
        screen_name = screen_name.replace("@", "")
        q = db.session.query(Tweet).filter(Tweet.screen_name==screen_name).order_by(Tweet.tweet_timestamp.desc())
        tweet = q.first()
        try:
            tweet_id = tweet.tweet_id
        except AttributeError:
            tweet_id = None
        return tweet_id

    @cached_property
    def tweet_text(self):
        try:
            return self.payload["text"]
        except TypeError:
            return None

    @cached_property
    def has_country(self):
        return self.country != None

    def set_attributes_from_post(self, post):
        self.tweet_id = post["tweet_id"]
        self.screen_name = post["author"]["id_on_source"]                
        self.tweet_timestamp = post["posted_on"]
        if "geo" in post["author"]:
            self.country = post["author"]["geo"].get("country", None)
            self.latitude = post["author"]["geo"].get("lt", None)
            self.longitude = post["author"]["geo"].get("ln", None)
        return self

    def __repr__(self):
        return u'<Tweet {tweet_id} {profile_id} {screen_name} {timestamp} {text}>'.format(
            tweet_id=self.tweet_id, 
            profile_id=self.profile_id, 
            screen_name=self.screen_name, 
            timestamp=self.tweet_timestamp, 
            text=self.text)

    def to_dict(self):
        attributes_to_ignore = [
        ]
        ret = dict_from_dir(self, attributes_to_ignore)
        return ret


example_contents = """{
        "contributors": null, 
        "coordinates": null, 
        "created_at": "Sun Dec 16 22:42:55 +0000 2012", 
        "entities": {
            "hashtags": [
                {
                    "indices": [
                        72, 
                        81
                    ], 
                    "text": "scholars"
                }
            ], 
            "symbols": [], 
            "urls": [
                {
                    "display_url": "shar.es/hfqDY", 
                    "expanded_url": "http://shar.es/hfqDY", 
                    "indices": [
                        83, 
                        103
                    ], 
                    "url": "http://t.co/GDwhOrnu"
                }
            ], 
            "user_mentions": [
                {
                    "id": 259990583, 
                    "id_str": "259990583", 
                    "indices": [
                        3, 
                        11
                    ], 
                    "name": "Karen Lips", 
                    "screen_name": "kwren88"
                }, 
                {
                    "id": 224631899, 
                    "id_str": "224631899", 
                    "indices": [
                        17, 
                        26
                    ], 
                    "name": "figshare", 
                    "screen_name": "figshare"
                }
            ]
        }, 
        "favorite_count": 0, 
        "favorited": false, 
        "geo": null, 
        "id": 280442912347664384, 
        "id_str": "280442912347664384", 
        "in_reply_to_screen_name": null, 
        "in_reply_to_status_id": null, 
        "in_reply_to_status_id_str": null, 
        "in_reply_to_user_id": null, 
        "in_reply_to_user_id_str": null, 
        "lang": "en", 
        "place": null, 
        "possibly_sensitive": false, 
        "retweet_count": 5, 
        "retweeted": false, 
        "retweeted_status": {
            "contributors": null, 
            "coordinates": {
                "coordinates": [
                    -77.01357981, 
                    39.01103526
                ], 
                "type": "Point"
            }, 
            "created_at": "Sun Dec 16 22:34:13 +0000 2012", 
            "entities": {
                "hashtags": [
                    {
                        "indices": [
                            59, 
                            68
                        ], 
                        "text": "scholars"
                    }
                ], 
                "symbols": [], 
                "urls": [
                    {
                        "display_url": "shar.es/hfqDY", 
                        "expanded_url": "http://shar.es/hfqDY", 
                        "indices": [
                            70, 
                            90
                        ], 
                        "url": "http://t.co/GDwhOrnu"
                    }
                ], 
                "user_mentions": [
                    {
                        "id": 224631899, 
                        "id_str": "224631899", 
                        "indices": [
                            4, 
                            13
                        ], 
                        "name": "figshare", 
                        "screen_name": "figshare"
                    }
                ]
            }, 
            "favorite_count": 0, 
            "favorited": false, 
            "geo": {
                "coordinates": [
                    39.01103526, 
                    -77.01357981
                ], 
                "type": "Point"
            }, 
            "id": 280440721884983297, 
            "id_str": "280440721884983297", 
            "in_reply_to_screen_name": null, 
            "in_reply_to_status_id": null, 
            "in_reply_to_status_id_str": null, 
            "in_reply_to_user_id": null, 
            "in_reply_to_user_id_str": null, 
            "lang": "en", 
            "place": {
                "attributes": {}, 
                "bounding_box": {
                    "coordinates": [
                        [
                            [
                                -77.064086, 
                                38.979735
                            ], 
                            [
                                -76.97162, 
                                38.979735
                            ], 
                            [
                                -76.97162, 
                                39.036964
                            ], 
                            [
                                -77.064086, 
                                39.036964
                            ]
                        ]
                    ], 
                    "type": "Polygon"
                }, 
                "contained_within": [], 
                "country": "United States", 
                "country_code": "US", 
                "full_name": "Silver Spring, MD", 
                "id": "6417871953fa5e86", 
                "name": "Silver Spring", 
                "place_type": "city", 
                "url": "https://api.twitter.com/1.1/geo/id/6417871953fa5e86.json"
            }, 
            "possibly_sensitive": false, 
            "retweet_count": 5, 
            "retweeted": false, 
            "source": "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>", 
            "text": "MT \"@figshare: Prevalence and use of Twitter growing among #scholars: http://t.co/GDwhOrnu\u201d", 
            "truncated": false, 
            "user": {
                "contributors_enabled": false, 
                "created_at": "Thu Mar 03 00:30:46 +0000 2011", 
                "default_profile": false, 
                "default_profile_image": false, 
                "description": "Amphibian Ecologist. Associate Professor Biology, UMaryland. Director, Graduate Program in Sustainable Development & Conservation Biology. tweets my own", 
                "entities": {
                    "description": {
                        "urls": []
                    }, 
                    "url": {
                        "urls": [
                            {
                                "display_url": "lipslab.weebly.com", 
                                "expanded_url": "http://lipslab.weebly.com/", 
                                "indices": [
                                    0, 
                                    22
                                ], 
                                "url": "http://t.co/8sw0WzjuIn"
                            }
                        ]
                    }
                }, 
                "favourites_count": 2979, 
                "follow_request_sent": null, 
                "followers_count": 1767, 
                "following": null, 
                "friends_count": 946, 
                "geo_enabled": true, 
                "id": 259990583, 
                "id_str": "259990583", 
                "is_translation_enabled": false, 
                "is_translator": false, 
                "lang": "en", 
                "listed_count": 92, 
                "location": "", 
                "name": "Karen Lips", 
                "notifications": null, 
                "profile_background_color": "C0DEED", 
                "profile_background_image_url": "http://pbs.twimg.com/profile_background_images/795249398/fae1497afc5e983974518244cf4aaba2.jpeg", 
                "profile_background_image_url_https": "https://pbs.twimg.com/profile_background_images/795249398/fae1497afc5e983974518244cf4aaba2.jpeg", 
                "profile_background_tile": false, 
                "profile_banner_url": "https://pbs.twimg.com/profile_banners/259990583/1348775951", 
                "profile_image_url": "http://pbs.twimg.com/profile_images/3495233234/70ac2d2c7299e4b04febca2beb83b74f_normal.png", 
                "profile_image_url_https": "https://pbs.twimg.com/profile_images/3495233234/70ac2d2c7299e4b04febca2beb83b74f_normal.png", 
                "profile_link_color": "0089B3", 
                "profile_sidebar_border_color": "FFFFFF", 
                "profile_sidebar_fill_color": "361645", 
                "profile_text_color": "02606A", 
                "profile_use_background_image": true, 
                "protected": false, 
                "screen_name": "kwren88", 
                "statuses_count": 11928, 
                "time_zone": "Eastern Time (US & Canada)", 
                "url": "http://t.co/8sw0WzjuIn", 
                "utc_offset": -14400, 
                "verified": false
            }
        }, 
        "source": "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>", 
        "text": "RT @kwren88: MT \"@figshare: Prevalence and use of Twitter growing among #scholars: http://t.co/GDwhOrnu\u201d", 
        "truncated": false, 
        "user": {
            "contributors_enabled": false, 
            "created_at": "Tue Mar 29 14:48:17 +0000 2011", 
            "default_profile": false, 
            "default_profile_image": false, 
            "description": "Postdoc,lazy blogger, co-host of http://t.co/uz2JfRCfki podcast. Interests: herpetology, behavioral ecology, evolution, genes and behavior. I heart salamanders.", 
            "entities": {
                "description": {
                    "urls": [
                        {
                            "display_url": "Breakingbio.com", 
                            "expanded_url": "http://Breakingbio.com", 
                            "indices": [
                                33, 
                                55
                            ], 
                            "url": "http://t.co/uz2JfRCfki"
                        }
                    ]
                }, 
                "url": {
                    "urls": [
                        {
                            "display_url": "natureafield.com", 
                            "expanded_url": "http://www.natureafield.com", 
                            "indices": [
                                0, 
                                22
                            ], 
                            "url": "http://t.co/I0kb1Imd6b"
                        }
                    ]
                }
            }, 
            "favourites_count": 789, 
            "follow_request_sent": null, 
            "followers_count": 1128, 
            "following": null, 
            "friends_count": 477, 
            "geo_enabled": true, 
            "id": 274000727, 
            "id_str": "274000727", 
            "is_translation_enabled": false, 
            "is_translator": false, 
            "lang": "en", 
            "listed_count": 91, 
            "location": "Buenos Aires, Argentina", 
            "name": "Heidi K Smith-Parker", 
            "notifications": null, 
            "profile_background_color": "FED105", 
            "profile_background_image_url": "http://pbs.twimg.com/profile_background_images/259765740/x069eeb809c51076b2883e31fbce942f.png", 
            "profile_background_image_url_https": "https://pbs.twimg.com/profile_background_images/259765740/x069eeb809c51076b2883e31fbce942f.png", 
            "profile_background_tile": true, 
            "profile_banner_url": "https://pbs.twimg.com/profile_banners/274000727/1349651541", 
            "profile_image_url": "http://pbs.twimg.com/profile_images/2963151089/d9cfaa7ab235dcd1ad3430d534c23929_normal.jpeg", 
            "profile_image_url_https": "https://pbs.twimg.com/profile_images/2963151089/d9cfaa7ab235dcd1ad3430d534c23929_normal.jpeg", 
            "profile_link_color": "E9BF05", 
            "profile_sidebar_border_color": "3B3B3B", 
            "profile_sidebar_fill_color": "3B3B3B", 
            "profile_text_color": "989898", 
            "profile_use_background_image": true, 
            "protected": false, 
            "screen_name": "HeidiKayDeidi", 
            "statuses_count": 7747, 
            "time_zone": null, 
            "url": "http://t.co/I0kb1Imd6b", 
            "utc_offset": null, 
            "verified": false
        }
    }"""
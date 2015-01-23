from totalimpactwebapp import json_sqlalchemy
from util import commit
from util import cached_property
from util import dict_from_dir
from util import as_int_or_float_if_possible
from totalimpactwebapp import db
from totalimpactwebapp.tweeter import Tweeter

from birdy.twitter import AppClient, TwitterApiError, TwitterRateLimitError, TwitterClientError
from collections import defaultdict
from sqlalchemy import case
import os
import re
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
        if tweet.tiid and tweet.tweet_text:
            response[tweet.tiid].append(tweet)
    return response


def store_tweet_payload_and_tweeter_from_twitter(payload_dicts_from_twitter, tweets):
    tweets_by_tweet_id = defaultdict(list)
    for tweet in tweets:
        tweets_by_tweet_id[tweet.tweet_id].append(tweet)

    for payload_dict in payload_dicts_from_twitter:
        tweet_id = payload_dict["id_str"]
        logger.debug("saving unsaved parts for tweet_id {tweet_id}".format(
            tweet_id=tweet_id))
        for tweet in tweets_by_tweet_id[tweet_id]:
            if not tweet.payload:
                tweet.payload = payload_dict
                logger.info(u"updated tweet payload for {tweet_id} {tiid}".format(
                    tweet_id=tweet_id, tiid=tweet.tiid))
                if "user" in payload_dict:
                    try:
                        tweet.tweeter.set_attributes_from_twitter_data(payload_dict["user"])
                    except AttributeError:
                        tweeter = Tweeter.query.get(tweet.screen_name)
                        if not tweeter:
                            tweeter = Tweeter(screen_name=tweet.screen_name)
                        tweeter.set_attributes_from_twitter_data(payload_dict["user"])
                        tweet.tweeter = tweeter
                    logger.info(u"updated tweeter followers for {screen_name}".format(
                        screen_name=tweet.tweeter.screen_name))
            

def flag_deleted_tweets(tweet_ids):
    if not tweet_ids:
        return None
    for tweet in Tweet.query.filter(Tweet.tweet_id.in_(tweet_ids)).all():
        # logger.debug("deleted tweet {tweet_id}".format(
        #     tweet_id=tweet_id))
        tweet.is_deleted = True
        db.session.merge(tweet)


def handle_all_tweets(data, tweets):
    # update with tweet text, tweeter
    store_tweet_payload_and_tweeter_from_twitter(data, tweets)
    tweet_ids = [tweet.tweet_id for tweet in tweets]

    # flag the rest as deleted
    tweet_ids_with_response = [tweet["id_str"] for tweet in data]
    tweet_ids_without_response = [tweet for tweet in tweet_ids if tweet not in tweet_ids_with_response]
    flag_deleted_tweets(tweet_ids_without_response)
    return True



# from https://github.com/inueni/birdy/issues/7
# to overrride JSONObject
class AppDictClient(AppClient):
    @staticmethod
    def get_json_object_hook(data):
        return data


def get_and_save_tweet_text_and_tweeter_followers(tweets):

    client = AppDictClient(
        os.getenv("TWITTER_CONSUMER_KEY"),
        os.getenv("TWITTER_CONSUMER_SECRET"),
        access_token=os.getenv("TWITTER_ACCESS_TOKEN")
    )

    logger.info(u"in get_and_save_tweet_text_and_tweeter_followers for {num} tweet_ids".format(
        num=len(tweets)))

    # print "lenth of tweet_ids", len(tweet_ids)

    # from http://stackoverflow.com/a/1624988/596939
    group_size = 100
    list_of_groups = [ tweets[i:i+group_size] for i in range(0, len(tweets), group_size) ]

    # print "number of groups", len(list_of_groups)

    for tweet_subset in list_of_groups:
        tweet_id_string = ",".join([tweet.tweet_id for tweet in tweet_subset])

        try:
            response = client.api.statuses.lookup.post(id=tweet_id_string, trim_user=False)
            handle_all_tweets(response.data, tweet_subset)
        except TwitterApiError, e:
            logger.exception("TwitterApiError error, skipping")
        except TwitterClientError, e:
            logger.exception("TwitterClientError error, skipping")
        except TwitterRateLimitError, e:
            logger.exception("TwitterRateLimitError error, skipping")
            # not totally sure what else I should do here.  retry somehow, or catch on cleanup run?

    # the function that calls this does a commit
    
    return





def hydrate_twitter_text_and_followers(profile_id, altmetric_twitter_posts):

    logger.info(u"in hydrate_twitter_text_and_followers for profile {profile_id}".format(
        profile_id=profile_id))

    tweets_to_hydrate_from_twitter = []
    # get them all at once into the session so gets below go faster
    tweets = Tweet.query.filter(Tweet.profile_id==profile_id)
    tweet_dict = dict([((tweet.tweet_id, tweet.tiid), tweet) for tweet in tweets])

    for tiid, post_list in altmetric_twitter_posts.iteritems():
        for post in post_list:
            #### store tweet and tweeter stuff from altmetric
            tweet_id = post["tweet_id"]
            screen_name = post["author"]["id_on_source"]

            if (tweet_id, tiid) in tweet_dict.keys():
                tweet = tweet_dict[(tweet_id, tiid)]
                if not tweet.tweet_text and not tweet.is_deleted:
                    tweets_to_hydrate_from_twitter.append(tweet)
            else:
                if not Tweet.query.get((tweet_id, tiid)):
                    tweet = Tweet(tweet_id=tweet_id, tiid=tiid)
                    tweet.set_attributes_from_altmetric_post(post)
                    tweet.profile_id = profile_id
                    tweets_to_hydrate_from_twitter.append(tweet)
                    db.session.add(tweet)
                if not tweet.tweeter:
                    tweeter = Tweeter.query.get(screen_name)
                    if not tweeter:
                        tweeter = Tweeter(screen_name=screen_name)
                    tweeter.set_attributes_from_altmetric_post(post)
                    db.session.add(tweeter)

    logger.info(u"before tweets_to_hydrate_from_twitter for {profile_id}".format(
        profile_id=profile_id))
    if tweets_to_hydrate_from_twitter:
        # save the altmetric stuff first
        commit(db)

        tweet_ids = [tweet.tweet_id for tweet in tweets_to_hydrate_from_twitter]
        logger.info(u"calling get_and_save_tweet_text_and_tweeter_followers for profile {profile_id}".format(
            profile_id=profile_id))

        get_and_save_tweet_text_and_tweeter_followers(tweets_to_hydrate_from_twitter)
        commit(db)

    else:
        logger.info(u"no tweets to hydrate for profile {profile_id}".format(
            profile_id=profile_id))

    return


# see http://docs.sqlalchemy.org/en/rel_0_9/orm/relationships.html#non-relational-comparisons-materialized-path
handle_workaround_join_string = "remote(Tweeter.screen_name)==case([(foreign(Tweet.screen_name)=='Dr_Bik', 'hollybik')], else_=foreign(Tweet.screen_name))"

# info from twitter at: https://dev.twitter.com/rest/reference/get/statuses/lookup
class Tweet(db.Model):
    tweet_id = db.Column(db.Text, primary_key=True)
    tiid = db.Column(db.Text, primary_key=True)  # alter table tweet add tiid text
    profile_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    screen_name = db.Column(db.Text, db.ForeignKey('tweeter.screen_name'))
    tweet_timestamp = db.Column(db.DateTime())
    payload = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))
    is_deleted = db.Column(db.Boolean)  # alter table tweet add is_deleted bool
    tweet_url = db.Column(db.Text) # alter table tweet add tweet_url text
    country = db.Column(db.Text) # alter table tweet add country text
    followers_at_time_of_tweet = db.Column(db.Integer) # alter table tweet add followers_at_time_of_tweet int4

    tweeter = db.relationship(
        'Tweeter',
        lazy='joined',
        cascade='all',
        backref=db.backref("tweet"),
        uselist=False,
        primaryjoin=handle_workaround_join_string
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
    def tweet_text_with_links(self):
        if self.tweet_text is None:
            return None

        ret = self.tweet_text
        # the tweet text has just stub links. replace these with real ones
        ret = re.sub(r"(http://.+?)(\s|$)", r"<link>", ret)
        for url_info in self.urls:
            my_link = u" <a class='linkout entity' href='{url}'>{display_url}</a> ".format(
                url=url_info["expanded_url"],
                display_url=url_info["display_url"]
            )
            ret = re.sub(r"<link>", my_link, ret, 1)

        # make links for #hashtags
        # this and the @usernames one both based on http://stackoverflow.com/a/13398311/226013
        ret = re.sub(r"(^|[^#\w])#(\w+)\b", r"\1<a href='http://twitter.com/hashtag/\2' class='entity hashtag'>#\2</a>", ret)

        # make links for @usernames
        ret = re.sub(r"(^|[^@\w])@(\w+)\b", r"\1<a href='http://twitter.com/\2' class='entity at-name'>@\2</a> ", ret)
        return ret


    @cached_property
    def urls(self):
        try:
            return self.payload["entities"]["urls"]
        except TypeError:
            return None
        except KeyError:
            return []



    @cached_property
    def has_country(self):
        return self.country != None

    def set_attributes_from_altmetric_post(self, post):
        self.tweet_id = post["tweet_id"]
        self.screen_name = post["author"]["id_on_source"]                
        self.tweet_timestamp = post["posted_on"]
        if "geo" in post["author"]:
            self.country = post["author"]["geo"].get("country", None)
        return self

    def __repr__(self):
        return u'<Tweet {tweet_id} {profile_id} {screen_name} {timestamp}>'.format(
            tweet_id=self.tweet_id, 
            profile_id=self.profile_id, 
            screen_name=self.screen_name, 
            timestamp=self.tweet_timestamp)

    def to_dict(self):
        attributes_to_ignore = [
            "payload"
        ]
        ret = dict_from_dir(self, attributes_to_ignore)
        return ret


twitter_example_contents = """{
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
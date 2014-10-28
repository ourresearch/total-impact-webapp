from totalimpactwebapp import json_sqlalchemy
from totalimpactwebapp.util import commit
from totalimpactwebapp.util import cached_property
from totalimpactwebapp import db
from totalimpactwebapp.twitter_paging import TwitterPager

from birdy.twitter import AppClient, TwitterApiError, TwitterRateLimitError, TwitterClientError
import os
import datetime
import datetime
import logging
logger = logging.getLogger('ti.webapp.tweets')


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

        store_tweets(profile_id=None, tiid=None, payload_dicts=data)

        tweet_ids_with_response = [tweet["id_str"] for tweet in data]
        tweet_ids_without_response = [tweet for tweet in tweet_ids if tweet not in tweet_ids_with_response]
        for tweet_id in tweet_ids_without_response:
            logger.debug("deleted tweet {tweet_id}".format(
                tweet_id=tweet_id))
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
        return store_tweets(profile_id, tiid=None, payload_dicts=r.data)

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


def store_tweets(profile_id, tiid, payload_dicts):
    for payload_dict in payload_dicts:
        tweet_id = payload_dict["id_str"]
        logger.debug("saving tweet {tweet_id}".format(
            tweet_id=tweet_id))
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



def save_product_tweets(profile_id, tiid, twitter_posts):
    for post in twitter_posts:
        tweet_id = post["tweet_id"]
        screen_name = post["author"]["id_on_source"]
        # print ".",

        tweet = Tweet.query.get(tweet_id)
        if not tweet:
            tweet = Tweet(
                screen_name=screen_name, 
                tweet_id=tweet_id,
                tweet_timestamp=post["posted_on"],
                profile_id=profile_id,
                tiid=tiid)
            db.session.add(tweet)
        
        #overwrite with new info even if already there
        tweeter = Tweeter.query.get(screen_name)
        if not tweeter:
            tweeter = Tweeter(screen_name=screen_name)
        tweeter.followers = post["author"].get("followers", 0)
        tweeter.name = post["author"].get("name", screen_name)
        tweeter.description = post["author"].get("description", "")
        tweeter.image_url = post["author"].get("image", None)
        db.session.add(tweeter)

    commit(db)


class Tweeter(db.Model):
    screen_name = db.Column(db.Text, primary_key=True)
    followers = db.Column(db.Integer)
    name = db.Column(db.Text)
    description = db.Column(db.Text)
    image_url = db.Column(db.Text)

    def __init__(self, **kwargs):
        super(Tweeter, self).__init__(**kwargs)

    def __repr__(self):
        return u'<Tweet {screen_name} {followers}>'.format(
            screen_name=self.screen_name, 
            followers=self.followers)


class Tweet(db.Model):
    tweet_id = db.Column(db.Text, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    screen_name = db.Column(db.Text)
    tweet_timestamp = db.Column(db.DateTime())
    payload = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))
    tiid = db.Column(db.Text)  # alter table tweet add tiid text
    is_deleted = db.Column(db.Boolean)  # alter table tweet add is_deleted bool

    def __init__(self, **kwargs):
        if "payload" in kwargs:
            payload_dict = kwargs["payload"]
            kwargs["tweet_id"] = payload_dict["id_str"]
            kwargs["screen_name"] = payload_dict["user"]["screen_name"]
            kwargs["payload"] = payload_dict
            kwargs["tweet_timestamp"] = datetime.datetime.strptime(payload_dict["created_at"], r"%a %b %d %H:%M:%S +0000 %Y")
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
    def retweeted(self):
        return self.payload["retweeted"]

    @cached_property
    def text(self):
        return self.payload["text"]

    def __repr__(self):
        return u'<Tweet {tweet_id} {profile_id} {screen_name} {timestamp} {text}>'.format(
            tweet_id=self.tweet_id, 
            profile_id=self.profile_id, 
            screen_name=self.screen_name, 
            timestamp=self.tweet_timestamp, 
            text=self.text)


example_contents = {u'contributors': None,
 u'coordinates': None,
 u'created_at': u'Fri Oct 17 16:25:59 +0000 2014',
 u'entities': {u'hashtags': [],
  u'symbols': [],
  u'urls': [{u'display_url': u'blog.impactstory.org/credit-peer-re\u2026',
    u'expanded_url': u'http://blog.impactstory.org/credit-peer-reviews/',
    u'indices': [100, 122],
    u'url': u'http://t.co/dWKxLiQ8H4'}],
  u'user_mentions': [{u'id': 127003086,
    u'id_str': u'127003086',
    u'indices': [3, 12],
    u'name': u'Todd Vision',
    u'screen_name': u'tjvision'},
   {u'id': 376019079,
    u'id_str': u'376019079',
    u'indices': [123, 131],
    u'name': u'Publons',
    u'screen_name': u'Publons'},
   {u'id': 375668090,
    u'id_str': u'375668090',
    u'indices': [132, 140],
    u'name': u'Impactstory',
    u'screen_name': u'Impactstory'}]},
 u'favorite_count': 0,
 u'favorited': False,
 u'geo': None,
 u'id': 523147923824340993,
 u'id_str': u'523147923824340993',
 u'in_reply_to_screen_name': None,
 u'in_reply_to_status_id': None,
 u'in_reply_to_status_id_str': None,
 u'in_reply_to_user_id': None,
 u'in_reply_to_user_id_str': None,
 u'lang': u'en',
 u'place': None,
 u'possibly_sensitive': False,
 u'retweet_count': 12,
 u'retweeted': False,
 u'retweeted_status': {
         u'contributors': None,
          u'coordinates': None,
          u'created_at': u'Thu Oct 16 20:39:59 +0000 2014',
          u'entities': {u'hashtags': [],
           u'symbols': [],
           u'urls': [{u'display_url': u'blog.impactstory.org/credit-peer-re\u2026',
             u'expanded_url': u'http://blog.impactstory.org/credit-peer-reviews/',
             u'indices': [86, 108],
             u'url': u'http://t.co/dWKxLiQ8H4'}],
           u'user_mentions': [{u'id': 376019079,
             u'id_str': u'376019079',
             u'indices': [109, 117],
             u'name': u'Publons',
             u'screen_name': u'Publons'},
            {u'id': 375668090,
             u'id_str': u'375668090',
             u'indices': [118, 130],
             u'name': u'Impactstory',
             u'screen_name': u'Impactstory'}]},
          u'favorite_count': 9,
          u'favorited': False,
          u'geo': None,
          u'id': 522849458527420416,
          u'id_str': u'522849458527420416',
          u'in_reply_to_screen_name': None,
          u'in_reply_to_status_id': None,
          u'in_reply_to_status_id_str': None,
          u'in_reply_to_user_id': None,
          u'in_reply_to_user_id_str': None,
          u'lang': u'en',
          u'place': None,
          u'possibly_sensitive': False,
          u'retweet_count': 12,
          u'retweeted': False,
          u'source': u'<a href="https://about.twitter.com/products/tweetdeck" rel="nofollow">TweetDeck</a>',
          u'text': u"Wouldn't you like to get some cred for the sweat and tears you put into peer reviews? http://t.co/dWKxLiQ8H4 @Publons @ImpactStory",
          u'truncated': False,
          u'user': 
                  {u'contributors_enabled': False,
                   u'created_at': u'Sat Mar 27 18:21:42 +0000 2010',
                   u'default_profile': False,
                   u'default_profile_image': False,
                   u'description': u'Evolution, genomics, bioinformatics & stuff @ UNC Chapel Hill & NESCent. ORCID:0000-0002-6133-2581. Image CC-BY-SA by schnobby at http://t.co/MpjyHunUV4',
                   u'entities': {u'description': {u'urls': [{u'display_url': u'wikimedia.org',
                       u'expanded_url': u'http://wikimedia.org',
                       u'indices': [130, 152],
                       u'url': u'http://t.co/MpjyHunUV4'}]},
                    u'url': {u'urls': [{u'display_url': u'mendeley.com/profiles/todd-\u2026',
                       u'expanded_url': u'http://www.mendeley.com/profiles/todd-vision/',
                       u'indices': [0, 22],
                       u'url': u'http://t.co/dr5G1MQlmT'}]}},
                   u'favourites_count': 700,
                   u'follow_request_sent': None,
                   u'followers_count': 954,
                   u'following': None,
                   u'friends_count': 436,
                   u'geo_enabled': False,
                   u'id': 127003086,
                   u'id_str': u'127003086',
                   u'is_translation_enabled': False,
                   u'is_translator': False,
                   u'lang': u'en',
                   u'listed_count': 56,
                   u'location': u'Carrboro NC',
                   u'name': u'Todd Vision',
                   u'notifications': None,
                   u'profile_background_color': u'C0DEED',
                   u'profile_background_image_url': u'http://pbs.twimg.com/profile_background_images/425647837/lotus.biltmore.jpg',
                   u'profile_background_image_url_https': u'https://pbs.twimg.com/profile_background_images/425647837/lotus.biltmore.jpg',
                   u'profile_background_tile': True,
                   u'profile_image_url': u'http://pbs.twimg.com/profile_images/378800000821019587/ea4d2f7c7be6cb839675a52cb8636e3b_normal.jpeg',
                   u'profile_image_url_https': u'https://pbs.twimg.com/profile_images/378800000821019587/ea4d2f7c7be6cb839675a52cb8636e3b_normal.jpeg',
                   u'profile_link_color': u'0084B4',
                   u'profile_sidebar_border_color': u'C0DEED',
                   u'profile_sidebar_fill_color': u'DDEEF6',
                   u'profile_text_color': u'333333',
                   u'profile_use_background_image': True,
                   u'protected': False,
                   u'screen_name': u'tjvision',
                   u'statuses_count': 3479,
                   u'time_zone': u'Eastern Time (US & Canada)',
                   u'url': u'http://t.co/dr5G1MQlmT',
                   u'utc_offset': -14400,
                   u'verified': False}
   },
 u'source': u'<a href="http://twitter.com" rel="nofollow">Twitter Web Client</a>',
 u'text': u"RT @tjvision: Wouldn't you like to get some cred for the sweat and tears you put into peer reviews? http://t.co/dWKxLiQ8H4 @Publons @Impact\u2026",
 u'truncated': False,
 u'user': 
         {u'contributors_enabled': False,
          u'created_at': u'Tue Nov 10 14:15:50 +0000 2009',
          u'default_profile': True,
          u'default_profile_image': False,
          u'description': u'cofounder of @impactstory: share the full impact of your research. Research passion: measuring data sharing and reuse. Adore cookies+cycling+reading+my fam.',
          u'entities': {u'description': {u'urls': []},
           u'url': {u'urls': [{u'display_url': u'researchremix.wordpress.com',
              u'expanded_url': u'http://researchremix.wordpress.com',
              u'indices': [0, 22],
              u'url': u'http://t.co/CNaGfZcH5K'}]}},
          u'favourites_count': 1846,
          u'follow_request_sent': None,
          u'followers_count': 4890,
          u'following': None,
          u'friends_count': 2025,
          u'geo_enabled': False,
          u'id': 88936048,
          u'id_str': u'88936048',
          u'is_translation_enabled': False,
          u'is_translator': False,
          u'lang': u'en',
          u'listed_count': 338,
          u'location': u'Vancouver Canada',
          u'name': u'Heather Piwowar',
          u'notifications': None,
          u'profile_background_color': u'C0DEED',
          u'profile_background_image_url': u'http://abs.twimg.com/images/themes/theme1/bg.png',
          u'profile_background_image_url_https': u'https://abs.twimg.com/images/themes/theme1/bg.png',
          u'profile_background_tile': False,
          u'profile_image_url': u'http://pbs.twimg.com/profile_images/519570521/heather_new_haircut_normal.jpg',
          u'profile_image_url_https': u'https://pbs.twimg.com/profile_images/519570521/heather_new_haircut_normal.jpg',
          u'profile_link_color': u'0084B4',
          u'profile_sidebar_border_color': u'C0DEED',
          u'profile_sidebar_fill_color': u'DDEEF6',
          u'profile_text_color': u'333333',
          u'profile_use_background_image': True,
          u'protected': False,
          u'screen_name': u'researchremix',
          u'statuses_count': 16900,
          u'time_zone': u'Pacific Time (US & Canada)',
          u'url': u'http://t.co/CNaGfZcH5K',
          u'utc_offset': -25200,
          u'verified': False}
  }



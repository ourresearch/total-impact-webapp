from totalimpactwebapp.product import Product
from totalimpactwebapp.profile import Profile
from totalimpactwebapp.profile import refresh_products_from_tiids
from totalimpactwebapp.pinboard import Pinboard
from totalimpactwebapp.reference_set import save_all_reference_set_lists
from totalimpactwebapp.reference_set import RefsetBuilder
from totalimpactwebapp.product_deets import populate_product_deets
from totalimpactwebapp.util import commit
from totalimpactwebapp import db
import tasks

from sqlalchemy import and_, func
import datetime
import os
import requests
import argparse
import logging
import time
from collections import defaultdict

logger = logging.getLogger("webapp.daily")



"""
requires these env vars be set in this environment:
DATABASE_URL
"""

try:
    # set jason's env variables for local running.
    import config
    config.set_env_vars_from_dot_env()
except ImportError:
    pass


def page_query(q):
    offset = 0
    while True:
        r = False
        for elem in q.limit(50).offset(offset):
           r = True
           yield elem
        offset += 50
        if not r:
            break

# from https://bitbucket.org/zzzeek/sqlalchemy/wiki/UsageRecipes/WindowedRangeQuery
# cited from many webpages as good way to do paging
def column_windows(session, column, windowsize):
    """Return a series of WHERE clauses against 
    a given column that break it into windows.

    Result is an iterable of tuples, consisting of
    ((start, end), whereclause), where (start, end) are the ids.

    Requires a database that supports window functions, 
    i.e. Postgresql, SQL Server, Oracle.

    Enhance this yourself !  Add a "where" argument
    so that windows of just a subset of rows can
    be computed.

    """
    def int_for_range(start_id, end_id):
        if end_id:
            return and_(
                column>=start_id,
                column<end_id
            )
        else:
            return column>=start_id

    q = session.query(
                column, 
                func.row_number().\
                        over(order_by=column).\
                        label('rownum')
                ).\
                from_self(column)
    if windowsize > 1:
        q = q.filter("rownum %% %d=1" % windowsize)

    intervals = [id for id, in q]

    while intervals:
        start = intervals.pop(0)
        if intervals:
            end = intervals[0]
        else:
            end = None
        yield int_for_range(start, end)



def windowed_query(q, column, windowsize):
    """"Break a Query into windows on a given column."""

    for whereclause in column_windows(
                                        q.session, 
                                        column, windowsize):
        for row in q.filter(whereclause).order_by(column):
            yield row





def add_product_deets_for_everyone(url_slug=None, skip_until_url_slug=None):
    if url_slug:
        profile_iterator = [Profile.query.filter_by(url_slug=url_slug).first()]
    else:
        q = db.session.query(Profile)
        profile_iterator = windowed_query(q, Profile.url_slug, 25)
        # profile_iterator = page_query(Profile.query.order_by(Profile.url_slug.asc()))

    run_id = datetime.datetime.utcnow().isoformat()
    for profile in profile_iterator:
        if skip_until_url_slug and skip_until_url_slug.lower() > profile.url_slug.lower():
            logger.info(u"in add_product_deets_for_everyone and skipping {url_slug}".format(
                url_slug=profile.url_slug))
            continue

        logger.info(u"add_product_deets_for_everyone: {url_slug}".format(
            url_slug=profile.url_slug))

        for product in profile.products_not_removed:
            # logger.info(u"add_product_deets_for_everyone: {url_slug}, tiid={tiid}".format(
            #     url_slug=profile.url_slug, tiid=product.tiid))
            product_deets = populate_product_deets(profile, product)  # not delayed
            product_deets.run_id = run_id
            db.session.add(product_deets)
        db.session.commit()


def deduplicate_everyone():
    q = db.session.query(Profile)
    for profile in windowed_query(q, Profile.url_slug, 25):
        logger.info(u"deduplicate_everyone: {url_slug}".format(url_slug=profile.url_slug))
        response = tasks.deduplicate.delay(profile.id)




def email_report_to_url_slug(url_slug=None):
    if url_slug:
        profile = Profile.query.filter(func.lower(Profile.url_slug) == func.lower(url_slug)).first()
        # print profile.url_slug
        tasks.send_email_report(profile)


def email_report_to_everyone_who_needs_one(max_emails=None):
    number_emails_sent = 0

    q = db.session.query(Profile)
    for profile in windowed_query(q, Profile.url_slug, 25):

        # logger.debug(u"in email_report_to_everyone_who_needs_one for {url_slug}".format(
        #     url_slug=profile.url_slug))

        try:
            if not profile.is_live:
                logger.info(u"not sending, profile is not live {url_slug}".format(url_slug=profile.url_slug))                
            if not profile.email or (u"@" not in profile.email):
                logger.info(u"not sending, no email address for {url_slug}".format(url_slug=profile.url_slug))
            elif profile.notification_email_frequency == "none":
                logger.info(u"not sending, {url_slug} is unsubscribed".format(url_slug=profile.url_slug))
            elif profile.last_email_sent and ((datetime.datetime.utcnow() - profile.last_email_sent).days < 7):
                logger.info(u"not sending, {url_slug} already got email this week".format(url_slug=profile.url_slug))
            else:
                logger.info(u"checking email for {url_slug}".format(url_slug=profile.url_slug))
                # status = tasks.send_email_if_new_diffs.delay(profile.id)
                status = tasks.send_email_if_new_diffs(profile)
                if status=="email sent":
                    number_emails_sent += 1    
                    if max_emails:
                        logger.info(u"sent an email, have {num} left before hitting max".format(
                        num = max_emails-number_emails_sent))
                logger.info(u"checked email for {url_slug}, status={status}".format(
                    url_slug=profile.url_slug, status=status))

        except Exception as e:
            logger.warning(u"EXCEPTION in email_report_to_everyone_who_needs_one for {url_slug}, skipping to next profile.  Error {e}".format(
                url_slug=profile.url_slug, e=e))
            pass

        if max_emails and number_emails_sent >= max_emails:
            logger.info(u"Reached max_number_profiles_to_consider, so no done queueing email")
            break

    return




def build_refsets(save_after_every_profile=False):
    refset_builder = RefsetBuilder()

    q = db.session.query(Profile)
    for profile in windowed_query(q, Profile.url_slug, 25):
        refset_builder.process_profile(profile)
        if save_after_every_profile:
            save_all_reference_set_lists(refset_builder)

    save_all_reference_set_lists(refset_builder)



def collect_embed(min_tiid=None):
    if min_tiid:
        q = db.session.query(Product).filter(Product.profile_id != None).filter(Product.tiid>min_tiid)
    else:
        q = db.session.query(Product).filter(Product.profile_id != None)

    start_time = datetime.datetime.utcnow()
    number_considered = 0.0
    number_markups = 0.0
    for product in windowed_query(q, Product.tiid, 25):
        number_considered += 1

        if product.genre=="unknown" or product.removed:
            continue

        try:
            embed_markup = product.get_embed_markup()
        except Exception:
            print "got an exception, skipping", product.aliases.best_url
            continue

        if embed_markup:
            print number_considered, number_markups, product.tiid, product.host, product.aliases.best_url
            # print "  got an embed for", product.genre, "!"
            product.embed_markup = embed_markup
            db.session.add(product)
            commit(db)
            number_markups += 1
            elapsed_seconds = (datetime.datetime.utcnow() - start_time).seconds
            print "elapsed seconds=", elapsed_seconds, ";  number per second=", number_considered/(0.1+elapsed_seconds)


def linked_accounts(account_type, url_slug=None, min_url_slug=None):
    column_name = account_type+"_id"
    if url_slug:
        q = db.session.query(Profile).filter(getattr(Profile, column_name) != None).filter(Profile.url_slug==url_slug)
    else:
        if min_url_slug:
            q = db.session.query(Profile).filter(getattr(Profile, column_name) != None).filter(Profile.url_slug>=min_url_slug)

        else:
            q = db.session.query(Profile).filter(getattr(Profile, column_name) != None)

    number_considered = 0.0
    for profile in windowed_query(q, Profile.url_slug, 25):
        number_considered += 1
        logger.info(u"{url_slug} previous number of account products: {num}".format(
            url_slug=profile.url_slug, num=len(profile.account_products)))
        existing_account_product_list = [p for p in profile.account_products if p.index_name==account_type]
        if existing_account_product_list:
            existing_account_product = existing_account_product_list[0]
            if existing_account_product.followers:
                logger.info(u"{url_slug} already has an account_product for {account_type}, so skipping".format(
                    url_slug=profile.url_slug, account_type=account_type))
            else:
                logger.info(u"{url_slug} already has an account_product for {account_type}, but no followers, so refreshing".format(
                    url_slug=profile.url_slug, account_type=account_type))
                refresh_products_from_tiids([existing_account_product.tiid], source="scheduled")
        else:
            logger.info(u"{url_slug} had no account_product for {account_type}, so adding".format(
                url_slug=profile.url_slug, account_type=account_type))
            tiids = profile.update_products_from_linked_account(account_type, update_even_removed_products=False)
            if tiids:
                logger.info(u"{url_slug} added {num} products for {account_type}".format(
                    url_slug=profile.url_slug, num=len(tiids), account_type=account_type))



tiids_that_need_twitter = """sl1uu922rwpl1htii64upwjs
zh61suvqesowwqi1qcn0v413
5jugcbn9anjkrb84y3zyqwix""".split()

def refresh_twitter(min_tiid=None):
    if min_tiid:
        q = db.session.query(Product).filter(Product.profile_id != None).filter(Product.tiid>min_tiid)
    else:
        q = db.session.query(Product).filter(Product.profile_id != None).filter(Product.tiid.in_(tiids_that_need_twitter))

    start_time = datetime.datetime.utcnow()
    number_considered = 0.0
    number_refreshed = 0
    for product in windowed_query(q, Product.tiid, 25):
        number_considered += 1
        try:
            if product.biblio.repository=="Twitter" and len(product.metrics)==0:
                print "refreshing", product.tiid, number_refreshed
                refresh_products_from_tiids([product.tiid], source="scheduled")
                number_refreshed += 1
                if number_refreshed >= 15:
                    #api limit
                    print "refreshed 15, so breaking now"
                    break
        except AttributeError:
            pass



def refresh_tweeted_products(min_tiid=None):

    if min_tiid:
        q = db.session.query(Product).filter(Product.profile_id != None).filter(Product.tiid>min_tiid)
    else:
        q = db.session.query(Product).filter(Product.profile_id != None)

    start_time = datetime.datetime.utcnow()
    number_considered = 0.0
    number_refreshed = 0
    for product in windowed_query(q, Product.tiid, 25):
        number_considered += 1
        try:
            if product.get_metric_by_name("altmetric_com", "tweets"):
                print number_refreshed, ". refreshing: ", product.tiid
                refresh_products_from_tiids([product.tiid], source="scheduled")
                number_refreshed += 1
                time.sleep(0.5)
                elapsed_seconds = (datetime.datetime.utcnow() - start_time).seconds
                print "elapsed seconds=", elapsed_seconds, ";  number per second=", number_considered/(0.1+elapsed_seconds)
                
        except AttributeError:
            pass



def run_through_twitter_pages(url_slug=None, min_url_slug=None):
    if url_slug:
        q = db.session.query(Profile).filter(Profile.twitter_id != None).filter(Profile.url_slug==url_slug)
    else:
        if min_url_slug:
            q = db.session.query(Profile).filter(Profile.twitter_id != None).filter(Profile.url_slug>=min_url_slug)
        else:
            q = db.session.query(Profile).filter(Profile.twitter_id != None)

    start_time = datetime.datetime.utcnow()
    number_considered = 0.0
    number_markups = 0.0
    
    from birdy.twitter import AppClient, TwitterApiError, TwitterRateLimitError
    from totalimpactwebapp.twitter_paging import TwitterPager
    from StringIO import StringIO
    import boto
    import pickle
    import time

    pager = TwitterPager(os.getenv("TWITTER_CONSUMER_KEY"), 
                    os.getenv("TWITTER_CONSUMER_SECRET"),
                    os.getenv("TWITTER_ACCESS_TOKEN"), 
                    default_max_pages=5)

    conn = boto.connect_s3(os.getenv("AWS_ACCESS_KEY_ID"), os.getenv("AWS_SECRET_ACCESS_KEY"))
    bucket_name = os.getenv("AWS_BUCKET", "impactstory-uploads-local")
    bucket = conn.get_bucket(bucket_name, validate=False)

    for profile in windowed_query(q, Profile.url_slug, 25):
        number_considered += 1
        twitter_handle = profile.twitter_id

        logger.info(u"{url_slug} has twitter handle {twitter_handle}".format(
            url_slug=profile.url_slug, twitter_handle=twitter_handle))

        def save_to_aws(r):
            if not r.data:
                print r.data
                print "no data, not saving to AWS"
                return 

            print "saving to aws"
            path = "twitter"
            key_name = "twitter_{twitter_handle}_{start_id}.json".format(
                twitter_handle=twitter_handle, start_id=r.data[-1].id_str)
            full_key_name = os.path.join(path, key_name)
            print "saving to", full_key_name
            k = bucket.new_key(full_key_name)
            # file_contents = r.data.items()
            file_contents = pickle.dumps(r.data)
            length = k.set_contents_from_file(StringIO(file_contents))
            print "saved length", length, "with "  

        try:
            r = pager.paginated_search(
                page_handler=save_to_aws,
                # see birdy AppClient docs and Twitter API docs for params
                # to pass in here:
                screen_name=twitter_handle, 
                count=200, 
                contributor_details=True, 
                include_rts=True,
                exclude_replies=False,
                trim_user=False
                )
        except TwitterApiError:
            print "TwitterApiError error, skipping"
            continue
        except TwitterClientError:
            print "TwitterClientError error, skipping"
            continue        
        print "done"


def star_best_products(url_slug=None, min_url_slug=None):
    if url_slug:
        q = db.session.query(Profile).filter(Profile.url_slug==url_slug)
    else:
        if min_url_slug:
            q = db.session.query(Profile).filter(Profile.url_slug>=min_url_slug)

        else:
            q = db.session.query(Profile)

    number_considered = 0.0
    start_time = datetime.datetime.utcnow()
    for profile in windowed_query(q, Profile.url_slug, 25):
        number_considered += 1

        if not profile.products:
            # print "no products"
            continue

        logger.info(u"*******calculating stars on {url_slug}".format(
            url_slug=profile.url_slug))

        sorted_products = sorted(profile.products_not_removed, key=lambda x: x.awardedness_score, reverse=True)
        sorted_products_articles = [p for p in sorted_products if p.genre=="article"]
        sorted_products_nonarticles = [p for p in sorted_products if p.genre!="article"]
        selected_products = []
        num_article_pins = min(3, len(sorted_products_articles))
        num_nonarticle_pins = min((4 - num_article_pins), len(sorted_products_nonarticles))
        selected_products += [p for p in sorted_products_articles[0:num_article_pins]]
        selected_products += [p for p in sorted_products_nonarticles[0:num_nonarticle_pins]]
        # print
        # print "\n".join([p.biblio.title for p in selected_products])

        all_cards = []
        for genre in profile.genres:
            all_cards.extend(genre.cards)
        sorted_cards = sorted(all_cards, key=lambda x: x.sort_by, reverse=True)

        sorted_cards_articles = [c for c in sorted_cards if c.genre=="article"]
        sorted_cards_nonarticles = [c for c in sorted_cards if c.genre!="article"]
        num_article_cards = min(2, len(sorted_cards_articles))
        num_nonarticle_cards = min((4 - num_article_cards), len(sorted_cards_nonarticles))

        selected_cards = []
        selected_cards += [c for c in sorted_cards_articles[0:num_article_cards]]
        selected_cards += [c for c in sorted_cards_nonarticles[0:num_nonarticle_cards]]
        # print [(c.card_type, c.genre, c.img_filename) for c in selected_cards]

        contents = {"one":[], "two":[]}
        contents["one"] = [["product", p.tiid] for p in selected_products]
        contents["two"] = [c.genre_card_address for c in selected_cards]

        # print contents
        board = Pinboard.query.filter_by(profile_id=profile.id).first()
        if board:
            board.contents = contents
            board.timestamp = datetime.datetime.utcnow()
        else:        
            board = Pinboard(
                profile_id=profile.id,
                contents=contents)

        db.session.add(board)
        commit(db)

        elapsed_seconds = (datetime.datetime.utcnow() - start_time).seconds
        print "elapsed seconds=", elapsed_seconds, ";  number per second=", number_considered/(0.1+elapsed_seconds)
  

def count_news_for_subscribers(url_slug=None, min_url_slug=None):
    if url_slug:
        q = db.session.query(Profile).filter(Profile.url_slug==url_slug)
    else:
        if min_url_slug:
            q = db.session.query(Profile).filter(Profile.stripe_id!=None).filter(Profile.url_slug>=min_url_slug)

        else:
            q = db.session.query(Profile).filter(Profile.stripe_id!=None)


    number_considered = 0.0
    total_with_news = 0
    total_number_of_products_with_news = defaultdict(int)
    start_time = datetime.datetime.utcnow()
    for profile in windowed_query(q, Profile.url_slug, 25):
        if profile.is_paid_subscriber:

            number_considered += 1

            logger.info(u"count_news_for_subscribers: {url_slug}".format(
                url_slug=profile.url_slug))
            number_of_products_with_news = 0
            for product in profile.products_not_removed:
                metric = product.get_metric_by_name("altmetric_com", "news")
                if metric:
                    number_of_products_with_news += 1
            if number_of_products_with_news:
                total_number_of_products_with_news[number_of_products_with_news] += 1
                total_with_news += 1

            logger.info(u"of {total} profiles, total_with_news:{total_with_news} ({percent}%)\ntotal_number_of_products_with_news:{total_number_of_products_with_news}".format(
                total=number_considered,
                total_with_news=total_with_news, 
                percent=100*total_with_news/number_considered,
                total_number_of_products_with_news=total_number_of_products_with_news))
        else:
            logger.info(u"count_news_for_subscribers: not counting {url_slug} because not a subscriber".format(
                url_slug=profile.url_slug))



def main(function, args):
    if function=="emailreports":
        if "url_slug" in args and args["url_slug"]:
            email_report_to_url_slug(args["url_slug"])
        else:    
            email_report_to_everyone_who_needs_one(args["max_emails"])
    elif function=="dedup":
        deduplicate_everyone()
    elif function=="productdeets":
        add_product_deets_for_everyone(args["url_slug"], args["skip_until_url_slug"])
    elif function=="refsets":
        build_refsets(args["save_after_every_profile"])
    elif function=="embed":
        collect_embed(args["min_tiid"])
    elif function=="linked_accounts":
        linked_accounts(args["account_type"], args["url_slug"], args["min_url_slug"])
    elif function=="refresh_tweeted_products":
        refresh_tweeted_products(args["min_tiid"])
    elif function=="run_through_twitter_pages":
        run_through_twitter_pages(args["url_slug"], args["min_url_slug"])
    elif function=="star":
        star_best_products(args["url_slug"], args["min_url_slug"])
    elif function=="count_news":
        count_news_for_subscribers(args["url_slug"], args["min_url_slug"])



if __name__ == "__main__":

    db.create_all()
    
    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run stuff.")
    parser.add_argument('function', type=str, help="one of emailreports, refsets, dedup, productdeets")
    parser.add_argument('--url_slug', default=None, type=str, help="url slug")
    parser.add_argument('--save_after_every_profile', action='store_true', help="use to debug refsets, saves refsets to db after every profile.  slow.")
    parser.add_argument('--skip_until_url_slug', default=None, help="when looping don't process till past this url_slug")
    parser.add_argument('--max_emails', default=None, type=int, help="max number of emails to send")
    parser.add_argument('--min_tiid', default=None, type=str, help="min_tiid")
    parser.add_argument('--min_url_slug', default=None, type=str, help="min_url_slug")
    parser.add_argument('--account_type', default=None, type=str, help="account_type")

    args = vars(parser.parse_args())
    print args
    
    print u"daily.py starting."
    main(args["function"], args)

    db.session.remove()
    



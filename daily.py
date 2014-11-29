from totalimpactwebapp.snap import Snap
from totalimpactwebapp.product import Product
from totalimpactwebapp.profile import Profile
from totalimpactwebapp.profile import refresh_products_from_tiids
from totalimpactwebapp.pinboard import Pinboard
from totalimpactwebapp.reference_set import save_all_reference_set_lists
from totalimpactwebapp.reference_set import RefsetBuilder
from totalimpactwebapp.product_deets import populate_product_deets
from totalimpactwebapp.drip_email import log_drip_email
from totalimpactwebapp.util import commit
from totalimpactwebapp.util import dict_from_dir
from totalimpactwebapp.tweet import save_product_tweets_for_profile
from totalimpactwebapp import db
import tasks

from sqlalchemy import and_, or_, func, between
import datetime
import os
import requests
import argparse
import logging
import time
import pickle
from collections import defaultdict, Counter, OrderedDict
import StringIO
import csv
import urllib
import hashlib
import json

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


    orcid_id = db.Column(db.Text)
    github_id = db.Column(db.Text)
    slideshare_id = db.Column(db.Text)
    twitter_id = db.Column(db.Text)
    figshare_id = db.Column(db.Text)




def csv_of_dict(mydicts):
    (header, rows) = build_csv_rows_from_dict(mydicts)

    mystream = StringIO.StringIO()
    dw = csv.DictWriter(mystream, delimiter=',', dialect=csv.excel, fieldnames=header)
    dw.writeheader()
    for row in rows:
        dw.writerow(row)
    contents = mystream.getvalue()
    mystream.close()
    return contents


def build_csv_rows_from_dict(mydicts):
    columns = []
    for dictrow in mydicts:
        print dictrow
        columns += dictrow.keys()
    columns = sorted(list(set(columns)))

    # make header row
    ordered_column_names = OrderedDict([(col, None) for col in columns])

    # body rows
    rows = []
    for dictrow in mydicts:
        ordered_contents = OrderedDict()
        for col in ordered_column_names:
            try:
                ordered_contents[col] = unicode(dictrow[col]).encode("utf8")
            except (AttributeError, KeyError):
                ordered_contents[col] = u""
        rows += [ordered_contents]
    return(ordered_column_names, rows)



def populate_profile_deets(profile):
    deets = defaultdict(int)
    deets["url_slug"] = profile.url_slug
    deets["email"] = profile.email
    deets["full_name"] = profile.full_name
    deets["created"] = profile.created.isoformat()
    deets["is_subscriber"] = profile.is_subscribed
    deets["is_paid_subscriber"] = profile.is_paid_subscriber
    deets["is_unpaid_subscriber"] = profile.is_subscribed and not profile.is_paid_subscriber
    deets["google_scholar_id"] = profile.google_scholar_id
    deets["orcid_id"] = profile.orcid_id
    deets["github_id"] = profile.github_id
    deets["slideshare_id"] = profile.slideshare_id
    deets["twitter_id"] = profile.twitter_id
    deets["figshare_id"] = profile.figshare_id
    deets["publons_id"] = profile.publons_id
    deets["has_bio"] = (None != profile.bio)
    deets["got_new_metrics_email"] = (None != profile.last_email_sent)
    deets["subscription_date"] = profile.subscription_start_date
    deets["oa_badge"] = profile.awards[0].level_name

    products = profile.display_products
    deets["number_products"] = len(products)
    deets["earliest_publication_year"] = 9999
    mendeley_disciplines = Counter()
    badges = Counter()
    highly_badges = Counter()
    citations = Counter()
    for product in products:
        for award in product.awards:
            badges[award.engagement_type] += 1
            if award.is_highly:
                highly_badges[award.engagement_type] += 1
        if product.awards:
            deets["products_with_awards"] += 1
        if product.awards and product.genre=="article":
            deets["articles_with_awards"] += 1
        num_highly_awards_for_this_product = len([1 for award in product.awards if award.is_highly])
        if num_highly_awards_for_this_product:
            deets["num_highly_awards_for_this_product"] += 1
        if product.has_file:
            deets["uploaded_file"] += 1
        if product.embed_markup:
            deets["embed_markup"] += 1
        if product.has_metrics:
            deets["has_metrics"] += 1
        if product.aliases and product.aliases.resolved_url:
            if "peerj" in product.aliases.resolved_url:
                deets["got_peerj"] += 1
            if "arxiv" in product.aliases.resolved_url:
                deets["got_arxiv"] += 1
            if "plos" in product.aliases.resolved_url:
                deets["got_plos"] += 1            
        if product.biblio:
            try:
                if product.biblio.year and int(product.biblio.year) < deets["earliest_publication_year"]:
                    deets["earliest_publication_year"] = int(product.biblio.year)
            except (AttributeError, ValueError):
                pass
        citation_metric = product.get_metric_by_name("scopus", "citations")
        if citation_metric:
            citations[citation_metric.current_value] += 1    
        mendeley_disciplines[product.mendeley_discipline] += 1

 
    gravatar_url = "http://www.gravatar.com/avatar.php?"
    gravatar_url += urllib.urlencode({'gravatar_id':hashlib.md5(profile.email.lower()).hexdigest()})
    gravatar_url += "?d=404"  #gravatar returns 404 if doesn't exist, with this
    gravitar_response = requests.get(gravatar_url)
    if gravitar_response.status_code==200:
        deets["has_gravitar"] = True


    deets["highly_badges"] = highly_badges.most_common(5)
    deets["badges"] = badges.most_common(5)
    deets["mendeley_discipline"] = mendeley_disciplines.most_common(3)
    deets["num_genres"] = len(profile.genres)

    sorted_citations = citations.most_common()
    sorted_citations.sort(key=lambda tup: tup[0], reverse=True) 
    # print sorted_citations
    number_of_papers_with_more_citations = 0
    for (cites, count) in sorted_citations:
        number_of_papers_with_more_citations += count
        if number_of_papers_with_more_citations > cites:
            break
        deets["hindex"] = number_of_papers_with_more_citations
        # print deets["hindex"]
    print deets["hindex"]

    for genre_dict in profile.genres:
        deets["genre_" + genre_dict.name] = genre_dict.num_products

    return deets



def profile_deets(url_slug=None, 
        min_url_slug=None, 
        start_days_ago=44, 
        end_days_ago=30):

    start_date = datetime.datetime.utcnow() - datetime.timedelta(days=start_days_ago)
    end_date = datetime.datetime.utcnow() - datetime.timedelta(days=end_days_ago)
    q = db.session.query(Profile) \
            .filter(Profile.created.between(start_date, end_date))

    if url_slug:
        q = db.session.query(Profile).filter(Profile.url_slug==url_slug)
    elif min_url_slug:
        q = q.filter(Profile.url_slug>=min_url_slug)

    profile_deets = []
    for profile in windowed_query(q, Profile.url_slug, 25):
        logger.info(u"profile_deets: {url_slug}".format(
            url_slug=profile.url_slug))
        profile_deets += [populate_profile_deets(profile)]
        # print csv_of_dict(profile_deets)
        # with open("profile_deets.pickle", "wb") as handle:
        #   pickle.dump(profile_deets, handle)

    print json.dumps(profile_deets, sort_keys=True, indent=4)

    print "****"
    print csv_of_dict(profile_deets)
    time.sleep(30)



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
            elif not profile.email or (u"@" not in profile.email):
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



def collect_embed(tiid=None, min_tiid=None):
    if tiid:
        q = db.session.query(Product).filter(Product.tiid==tiid)
    else:
        q = db.session.query(Product).join(Profile).filter(Profile.stripe_id != None)
        if min_tiid:
            q = q.filter(Product.tiid>min_tiid)

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


def live_profile_query():
    from totalimpactwebapp.profile import default_free_trial_days
    min_created_date = datetime.datetime.utcnow() - datetime.timedelta(days=default_free_trial_days)
    q = db.session.query(Profile).filter(or_(Profile.is_advisor!=None, Profile.stripe_id!=None, Profile.created>=min_created_date))
    return q

def profile_query(url_slug=None, min_url_slug=None):
    if url_slug:
        q = db.session.query(Profile).filter(Profile.url_slug==url_slug)
    else:
        q = live_profile_query()
        if min_url_slug:
            q = q.filter(Profile.url_slug>=min_url_slug)
    return q

def borked_pinboards_for_life_profiles(url_slug=None, min_url_slug=None):
    problem_urls = []
    blank_urls = []
    if url_slug:
        q = db.session.query(Profile).filter(Profile.url_slug==url_slug)
    else:
        q = live_profile_query()
        if min_url_slug:
            q = q.filter(Profile.url_slug>=min_url_slug)
    for profile in windowed_query(q, Profile.url_slug, 25):
        all_profile_tiids = [product.tiid for product in profile.products] #includes removed
        print profile.url_slug, profile.id        
        board = Pinboard.query.filter_by(profile_id=profile.id).first()
        if board:
            tiids = [tiid for (dummy, tiid) in board.contents["one"]]
            if not tiids:
                logger.debug("{url} has blank pinboard".format(
                    url=profile.url_slug))
                blank_urls.append(profile.url_slug)
            for tiid in tiids:
                if tiid not in all_profile_tiids:
                    logger.debug("{url} does not own this pinboard {board}".format(
                        url=profile.url_slug, board=board))
                    problem_urls.append(profile.url_slug)
    logger.debug("problem urls: {urls}".format(
        urls=problem_urls))
    logger.debug("blank urls: {urls}".format(
        urls=blank_urls))



def new_metrics_for_live_profiles(url_slug=None, min_url_slug=None):
    if url_slug:
        q = db.session.query(Profile).filter(Profile.url_slug==url_slug)
    else:
        min_created_date = datetime.datetime.utcnow() - datetime.timedelta(days=30)
        q = db.session.query(Profile).filter(or_(Profile.is_advisor!=None, Profile.stripe_id!=None, Profile.created>=min_created_date))
        if min_url_slug:
            q = q.filter(Profile.url_slug>=min_url_slug)

        # also, only if not refreshed recently
        min_last_refreshed = datetime.datetime.utcnow() - datetime.timedelta(days=7)
        q = q.filter(Profile.last_refreshed < min_last_refreshed)

    start_time = datetime.datetime.utcnow()
    number_profiles = 0.0
    total_refreshes = 0
    for profile in windowed_query(q, Profile.url_slug, 25):
        number_profiles += 1
        print profile.url_slug, profile.id, profile.last_refreshed
        number_refreshes = len(profile.display_products)
        if number_refreshes:
            profile.refresh_products(source="scheduled")
            total_refreshes += number_refreshes
            pause_length = min(number_refreshes * 2, 60)
            print "pausing", pause_length, "seconds after refreshing", number_refreshes, "products"
            time.sleep(pause_length)
            print total_refreshes, "total refreshes across", number_profiles, "profiles"
            elapsed_seconds = (datetime.datetime.utcnow() - start_time).seconds
            print "elapsed seconds=", elapsed_seconds, ";  number profiles per second=", number_profiles/(0.1+elapsed_seconds)




from totalimpactwebapp.countries_info import country_iso_by_name


def update_mendeley_countries_for_live_profiles(url_slug=None, min_url_slug=None):
    q = profile_query(url_slug, min_url_slug)

    for profile in windowed_query(q, Profile.url_slug, 25):
        logger.info(u"{url_slug} processing mendeley countries".format(
            url_slug=profile.url_slug))
        for product in profile.display_products:
            metric = product.get_metric_by_name("mendeley", "countries")
            if metric:
                snap = metric.most_recent_snap
                if not snap.raw_value:
                    # logger.error(u"{url_slug} has NO SNAP for tiid {tiid}".format(
                    #     url_slug=profile.url_slug, tiid=product.tiid))
                    # don't save this one to the db
                    continue
                new_snap_value = {}
                for country_name, country_count in snap.raw_value.iteritems():
                    if country_name in country_iso_by_name:
                        iso = country_iso_by_name[country_name]
                        new_snap_value[iso] = country_count
                        # logger.error(u"{country_name} -> {iso}".format(
                        #     country_name=country_name, iso=iso))
                    else:
                        if len(country_name) != 2:
                            logger.error(u"Can't find country {country} in lookup".format(
                                country=country_name))
                        new_snap_value[country_name] = country_count
                if new_snap_value:
                    logger.info(u"New snap value {snap}".format(
                        snap=new_snap_value))
                    snap.raw_value = new_snap_value
                    db.session.add(snap)
                    commit(db)




def collect_new_mendeley(url_slug=None, min_url_slug=None):
    if url_slug:
        q = db.session.query(Profile).filter(Profile.url_slug==url_slug)
    else:
        q = db.session.query(Profile).filter(or_(Profile.is_advisor!=None, Profile.stripe_id!=None))
        if min_url_slug:
            q = q.filter(Profile.url_slug>=min_url_slug)

    start_time = datetime.datetime.utcnow()
    number_profiles = 0.0
    total_refreshes = 0
    for profile in windowed_query(q, Profile.url_slug, 25):
        number_profiles += 1
        number_refreshes = 0.0
        print profile.url_slug, profile.id
        for product in profile.display_products:
            if product.get_metric_by_name("mendeley", "readers"):
                number_refreshes += 1
                refresh_products_from_tiids([product.tiid], source="scheduled")
        if number_refreshes:
            total_refreshes += number_refreshes
            pause_length = min(number_refreshes * 2, 60)
            print "pausing", pause_length, "seconds after refreshing", number_refreshes, "products"
            time.sleep(pause_length)
            print total_refreshes, "total refreshes across", number_profiles, "profiles"
            elapsed_seconds = (datetime.datetime.utcnow() - start_time).seconds
            print "elapsed seconds=", elapsed_seconds, ";  number profiles per second=", number_profiles/(0.1+elapsed_seconds)




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


def run_through_altmetric_tweets(url_slug=None, min_url_slug=None):
    q = profile_query(url_slug, min_url_slug)

    total_objects_saved = 0
    for profile in windowed_query(q, Profile.url_slug, 25):
        logger.info(u"{url_slug}".format(
            url_slug=profile.url_slug))

        new_objects = save_product_tweets_for_profile(profile)
        total_objects_saved += len(new_objects)
        print "total_objects_saved", total_objects_saved


def get_tweet_text(min_tiid=None):
    from totalimpactwebapp.tweet import Tweet
    from totalimpactwebapp.tweet import save_specific_tweets
    from totalimpactwebapp.tweet import TwitterPager

    from sqlalchemy.sql import text
    q = db.session.query(Tweet).filter(Tweet.payload==None, Tweet.is_deleted==None)

    pager = TwitterPager(os.getenv("TWITTER_CONSUMER_KEY"), 
                        os.getenv("TWITTER_CONSUMER_SECRET"),
                        os.getenv("TWITTER_ACCESS_TOKEN"), 
                        default_max_pages=1)

    tweet_batch = []
    for tweet in windowed_query(q, Tweet.tweet_id, 100):
        tweet_batch.append(tweet)
        if len(tweet_batch) >= 100:
            tweet_ids = [tweet.tweet_id for tweet in tweet_batch]
            save_specific_tweets(tweet_ids, pager=pager)
            tweet_batch = []
    # run it again with stragglers
    if tweet_batch:
        tweet_ids = [tweet.tweet_id for tweet in tweet_batch]
        save_specific_tweets(tweet_ids, pager=pager)


def run_through_twitter_pages(url_slug=None, min_url_slug=None):
    if url_slug:
        q = db.session.query(Profile).filter(Profile.twitter_id != None).filter(Profile.url_slug==url_slug)
    else:
        q = db.session.query(Profile).filter(or_(Profile.is_advisor!=None, Profile.stripe_id!=None)).filter(Profile.twitter_id != None)
        if min_url_slug:
            q = q.filter(Profile.url_slug>=min_url_slug)

    from totalimpactwebapp.tweet import save_recent_tweets

    for profile in windowed_query(q, Profile.url_slug, 25):

        logger.info(u"{url_slug} has twitter handle {twitter_handle}, now saving tweets".format(
            url_slug=profile.url_slug, twitter_handle=profile.twitter_id))
        save_recent_tweets(profile.id, profile.twitter_id)



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




def send_drip_emails(url_slug=None, min_url_slug=None):
    MIN_AGE_DAYS_FOR_DRIP_EMAIL = 28
    DRIP_MILESTONE = "last-chance"

    if url_slug:
        q = db.session.query(Profile).filter(Profile.url_slug==url_slug)
    else:
        drip_email_create_date = datetime.datetime.utcnow() - datetime.timedelta(days=MIN_AGE_DAYS_FOR_DRIP_EMAIL)
        logger.info(u"in send_drip_emails with drip_email_create_date:{drip_email_create_date}".format(
            drip_email_create_date=drip_email_create_date))

        # only profiles that have null stripe ids and are at least drip email days old
        q = db.session.query(Profile) \
                .filter(Profile.stripe_id==None) \
                .filter(Profile.created <= drip_email_create_date)
        if min_url_slug:
            q = q.filter(Profile.url_slug >= min_url_slug)

    for profile in windowed_query(q, Profile.url_slug, 25):
        # logger.info(u"in send_drip_emails with {url_slug}".format(
        #     url_slug=profile.url_slug))

        if profile.is_trialing and not profile.received_drip_email(DRIP_MILESTONE):
            logger.info(u"in send_drip_emails, sending email to: {url_slug}".format(
                url_slug=profile.url_slug))
            tasks.send_drip_email(profile, DRIP_MILESTONE)
            drip_log = log_drip_email(profile, DRIP_MILESTONE)
            logger.info(u"in send_drip_emails, SENT EMAIL to: {url_slug}".format(
                url_slug=profile.url_slug))
        else:
            pass
            # logger.info(u"in send_drip_emails, but NOT sending email to: {url_slug}".format(
            #     url_slug=profile.url_slug))



def ip_deets():
    from totalimpactwebapp.interaction import Interaction
    from totalimpactwebapp.interaction import get_ip_insights 
    q = db.session.query(Interaction)
    cache = {}
    for interaction in windowed_query(q, Interaction.ip, 25):
        if interaction.country:
            continue
            
        if interaction.ip in cache:
            interaction.country, interaction.user_type = cache[interaction.ip]
        else:
            insights = get_ip_insights(interaction.ip)
            interaction.country = insights.country.iso_code
            interaction.user_type = insights.traits.user_type
            cache[interaction.ip] = interaction.country, interaction.user_type
            print interaction.country, interaction.user_type
        db.session.add(interaction)
        commit(db)




def countries_for_all_profiles(url_slug=None, min_created_date=None):
    if url_slug:
        q = db.session.query(Profile).filter(Profile.url_slug==url_slug)
    else:
        q = db.session.query(Profile).filter(or_(Profile.is_advisor!=None, Profile.stripe_id!=None))
        if min_created_date:
            q = q.filter(Profile.created >= min_created_date)

    countries = {}
    start_time = datetime.datetime.utcnow()
    number_profiles = 0.0
    total_refreshes = 0
    for profile in windowed_query(q, Profile.created, 25):  # sort by created

        if number_profiles > 500:
            print "ok, got country data for 500 profiles. quitting."
            return True

        number_profiles += 1
        number_refreshes = 0.0
        print "getting countries for", profile.url_slug, profile.id, profile.created

        for my_country in profile.countries:
            pass








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
        collect_embed(args["tiid"], args["min_tiid"])
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
    elif function=="drip_email":
        send_drip_emails(args["url_slug"], args["min_url_slug"])
    elif function=="profile_deets":
        profile_deets(args["url_slug"], args["min_url_slug"], args["start_days_ago"], args["end_days_ago"])
    elif function=="new_mendeley":
        collect_new_mendeley(args["url_slug"], args["min_url_slug"])
    elif function=="ip_deets":
        ip_deets()
    elif function=="run_through_altmetric_tweets":
        run_through_altmetric_tweets(args["url_slug"], args["min_url_slug"])
    elif function=="tweet_text":
        get_tweet_text()
    elif function=="new_metrics_for_live_profiles":
        new_metrics_for_live_profiles(args["url_slug"], args["min_url_slug"])
    elif function=="borked_pinboards_for_life_profiles":
        borked_pinboards_for_life_profiles(args["url_slug"], args["min_url_slug"])
    elif function=="update_mendeley_countries_for_live_profiles":
        update_mendeley_countries_for_live_profiles(args["url_slug"], args["min_url_slug"])




if __name__ == "__main__":

    db.create_all()
    
    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run stuff.")
    parser.add_argument('function', type=str, help="one of emailreports, refsets, dedup, productdeets")
    parser.add_argument('--url_slug', default=None, type=str, help="url slug")
    parser.add_argument('--tiid', default=None, type=str, help="tiid")
    parser.add_argument('--save_after_every_profile', action='store_true', help="use to debug refsets, saves refsets to db after every profile.  slow.")
    parser.add_argument('--skip_until_url_slug', default=None, help="when looping don't process till past this url_slug")
    parser.add_argument('--max_emails', default=None, type=int, help="max number of emails to send")
    parser.add_argument('--min_tiid', default=None, type=str, help="min_tiid")
    parser.add_argument('--min_url_slug', default=None, type=str, help="min_url_slug")
    parser.add_argument('--account_type', default=None, type=str, help="account_type")
    parser.add_argument('--start_days_ago', default=44, type=int)
    parser.add_argument('--end_days_ago', default=30, type=int)

    args = vars(parser.parse_args())
    print args
    
    print u"daily.py starting."
    main(args["function"], args)

    db.session.remove()
    



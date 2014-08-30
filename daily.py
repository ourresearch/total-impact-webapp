from totalimpactwebapp.product import Product
from totalimpactwebapp.product import get_file_embed_markup
from totalimpactwebapp.profile import Profile
from totalimpactwebapp.reference_set import save_all_reference_set_lists
from totalimpactwebapp.reference_set import RefsetBuilder
from totalimpactwebapp.product_deets import populate_product_deets
from totalimpactwebapp.util import commit
from totalimpactwebapp import db
import tasks

from sqlalchemy import and_, func
import datetime
import argparse
import logging

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



def collect_embed():
    q = db.session.query(Product).filter(Product.profile_id != None).filter(Product.embed_markup != None)
    start_time = datetime.datetime.utcnow()
    number_considered = 0.0
    number_markups = 0.0
    for product in windowed_query(q, Product.tiid, 25):
        number_considered += 1

        if product.genre=="unknown" or product.removed:
            continue

        try:
            embed_markup = get_file_embed_markup(product)
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
            print "elapsed seconds=", elapsed_seconds, ";  number per second=", number_considered/elapsed_seconds
        print "."



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
        collect_embed()



if __name__ == "__main__":

    db.create_all()
    
    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run stuff.")
    parser.add_argument('function', type=str, help="one of emailreports, refsets, dedup, productdeets")
    parser.add_argument('--url_slug', default=None, type=str, help="url slug")
    parser.add_argument('--save_after_every_profile', action='store_true', help="use to debug refsets, saves refsets to db after every profile.  slow.")
    parser.add_argument('--skip_until_url_slug', default=None, help="when looping don't process till past this url_slug")
    parser.add_argument('--max_emails', default=None, type=int, help="max number of emails to send")

    args = vars(parser.parse_args())
    print args
    
    print u"daily.py starting."
    main(args["function"], args)

    db.session.remove()
    



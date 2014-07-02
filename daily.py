from totalimpactwebapp.profile import Profile
from totalimpactwebapp.reference_set import save_all_reference_set_lists
from totalimpactwebapp.reference_set import RefsetBuilder
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





def add_profile_deets_for_everyone():
    for profile in page_query(Profile.query.order_by(Profile.url_slug.asc())):
        logger.info(u"add_profile_deets_for_everyone: {url_slug}".format(url_slug=profile.url_slug))
        response = tasks.add_profile_deets.delay(profile)


def deduplicate_everyone():
    for profile in page_query(Profile.query.order_by(Profile.url_slug.asc())):
        logger.info(u"deduplicate_everyone: {url_slug}".format(url_slug=profile.url_slug))
        response = tasks.deduplicate.delay(profile)



def create_cards_for_everyone(url_slug=None):
    cards = []
    if url_slug:
        profile = Profile.query.filter(func.lower(Profile.url_slug) == func.lower(url_slug)).first()
        # print profile.url_slug
        cards = tasks.create_cards(profile)
    else:    
        for profile in page_query(Profile.query.order_by(Profile.url_slug.asc())):
            # print profile.url_slug
            cards = tasks.create_cards.delay(profile)
    return cards



def email_report_to_url_slug(url_slug=None):
    if url_slug:
        profile = Profile.query.filter(func.lower(Profile.url_slug) == func.lower(url_slug)).first()
        # print profile.url_slug
        tasks.send_email_report(profile)


def email_report_to_everyone_who_needs_one():
    for profile in page_query(Profile.query.order_by(Profile.url_slug.asc())):

        try:
            if not profile.email or (u"@" not in profile.email):
                logger.info(u"not sending, no email address for {url_slug}".format(url_slug=profile.url_slug))
            elif profile.notification_email_frequency == "none":
                logger.info(u"not sending, {url_slug} is unsubscribed".format(url_slug=profile.url_slug))
            elif profile.last_email_sent and ((datetime.datetime.utcnow() - profile.last_email_sent).days < 7):
                logger.info(u"not sending, {url_slug} already got email this week".format(url_slug=profile.url_slug))
            else:
                logger.info(u"adding ASYNC notification check to celery for {url_slug}".format(url_slug=profile.url_slug))
                status = tasks.send_email_if_new_diffs.delay(profile.id)
        except Exception as e:
            logger.warning(u"EXCEPTION in email_report_to_everyone_who_needs_one for {url_slug}, skipping to next profile.  Error {e}".format(
                url_slug=profile.url_slug, e=e))
            pass
    return




def build_refsets(save_after_every_profile=False):
    refset_builder = RefsetBuilder()

    q = db.session.query(Profile)

    for profile in windowed_query(q, Profile.url_slug, 25):
        refset_builder.process_profile(profile)
        if save_after_every_profile:
            save_all_reference_set_lists(refset_builder)

    save_all_reference_set_lists(refset_builder)



def main(function, args):
    if function=="email_report":
        if "url_slug" in args:
            email_report_to_url_slug(args["url_slug"])
        else:    
            email_report_to_everyone_who_needs_one()
    elif function=="dedup":
        deduplicate_everyone()
    elif function=="profile_deets":
        add_profile_deets_for_everyone()
    elif function=="refsets":
        build_refsets(args["save_after_every_profile"])



if __name__ == "__main__":

    db.create_all()
    
    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run stuff")
    parser.add_argument('function', default="refsets", type=str, help="function")
    parser.add_argument('--url_slug', default=None, type=str, help="url slug")
    parser.add_argument('--save_after_every_profile', default=False, type=bool)

    args = vars(parser.parse_args())
    print args
    
    print u"daily.py starting."
    main(args["function"], args)

    db.session.remove()
    



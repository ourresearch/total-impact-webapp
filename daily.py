from totalimpactwebapp.profile import Profile
from totalimpactwebapp.profile import ProductsFromCore
from totalimpactwebapp import db
import tasks

from sqlalchemy import func
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
        for elem in q.limit(5).offset(offset):
           r = True
           yield elem
        offset += 5
        if not r:
            break

def add_profile_deets_for_everyone():
    for profile in page_query(Profile.query.order_by(Profile.url_slug.asc())):
        ProductsFromCore.clear_cache()
        logger.info(u"add_profile_deets_for_everyone: {url_slug}".format(url_slug=profile.url_slug))
        response = tasks.add_profile_deets.delay(profile)


def deduplicate_everyone():
    for profile in page_query(Profile.query.order_by(Profile.url_slug.asc())):
        ProductsFromCore.clear_cache()
        logger.info(u"deduplicate_everyone: {url_slug}".format(url_slug=profile.url_slug))
        response = tasks.deduplicate.delay(profile)



def create_cards_for_everyone(url_slug=None):
    cards = []
    if url_slug:
        profile = Profile.query.filter(func.lower(Profile.url_slug) == func.lower(url_slug)).first()
        ProductsFromCore.clear_cache()
        # print profile.url_slug
        cards = tasks.create_cards(profile)
    else:    
        for profile in page_query(Profile.query.order_by(Profile.url_slug.asc())):
            ProductsFromCore.clear_cache()
            # print profile.url_slug
            cards = tasks.create_cards.delay(profile)
    return cards



def email_report_to_url_slug(url_slug=None):
    if url_slug:
        profile = Profile.query.filter(func.lower(Profile.url_slug) == func.lower(url_slug)).first()
        ProductsFromCore.clear_cache()
        # print profile.url_slug
        tasks.send_email_report(profile)


def email_report_to_everyone_who_needs_one():
    for profile in page_query(Profile.query.order_by(Profile.url_slug.asc())):

        logger.info(u"clearing profile cache for {url_slug}".format(
            url_slug=profile.url_slug))

        ProductsFromCore.clear_cache()

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


def main(function, url_slug):
    if function=="email_report":
        if url_slug:
            email_report_to_url_slug(url_slug)
        else:    
            email_report_to_everyone_who_needs_one()
    elif function=="dedup":
        deduplicate_everyone()
    elif function=="profile_deets":
        add_profile_deets_for_everyone()



if __name__ == "__main__":

    db.create_all()
    
    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run stuff")
    parser.add_argument('--url_slug', default=None, type=str, help="url slug")
    # parser.add_argument('--celery', default=True, type=bool, help="celery")
    parser.add_argument('--function', default="email_report", type=str, help="function")
    args = vars(parser.parse_args())
    print args
    print u"daily.py starting."
    main(args["function"], args["url_slug"])

    db.session.remove()
    



from totalimpactwebapp.user import User
from totalimpactwebapp import db
from totalimpactwebapp import products_list
import tasks

from sqlalchemy import func
from celery import chain
import time
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
    for user in page_query(User.query.order_by(User.url_slug.asc())):
        # print user.url_slug
        tasks.add_profile_deets.delay(user)


def deduplicate_everyone():
    for user in page_query(User.query.order_by(User.url_slug.asc())):
        # print user.url_slug
        removed_tiids = tasks.deduplicate.delay(user)




def create_cards_for_everyone(url_slug=None):
    cards = []
    if url_slug:
        user = User.query.filter(func.lower(User.url_slug) == func.lower(url_slug)).first()
        # print user.url_slug        
        cards = tasks.create_cards(user)
    else:    
        for user in page_query(User.query.order_by(User.url_slug.asc())):
            # print user.url_slug        
            cards = tasks.create_cards.delay(user)
    return cards



def email_report_to_url_slug(url_slug=None):
    if url_slug:
        user = User.query.filter(func.lower(User.url_slug) == func.lower(url_slug)).first()
        # print user.url_slug        
        tasks.send_email_report(user, override_with_send=True)



def email_report_to_everyone_who_needs_one():
    for user in page_query(User.query.order_by(User.url_slug.asc())):
        try:
            if not user.email:
                logger.debug(u"not sending, no email address for {url_slug}".format(url_slug=user.url_slug))
            elif user.notification_email_frequency == "none":
                logger.debug(u"not sending, {url_slug} is unsubscribed".format(url_slug=user.url_slug))
            else:
                latest_diff_timestamp = products_list.latest_diff_timestamp(user.products)

                if (latest_diff_timestamp > user.last_email_check.isoformat()):
                    logger.debug("has diffs since last email check!  calling send_email report for {url_slug}".format(url_slug=user.url_slug))
                    tasks.send_email_report(user)
                else:
                    logger.debug(u"not sending, no new diffs since last email sent for {url_slug}".format(url_slug=user.url_slug))
        except Exception as e:
            logger.warning(u"EXCEPTION in email_report_to_everyone_who_needs_one for {url_slug}, skipping to next user".format(url_slug=user.url_slug))
            pass
    return


def main(function, url_slug):
    if url_slug:
        email_report_to_url_slug(url_slug)
    else:    
        email_report_to_everyone_who_needs_one()



if __name__ == "__main__":

    db.create_all()
    
    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run stuff")
    parser.add_argument('--url_slug', default=None, type=str, help="url slug")
    # parser.add_argument('--celery', default=True, type=bool, help="celery")
    parser.add_argument('--function', default=None, type=str, help="function")
    args = vars(parser.parse_args())
    print args
    print u"daily.py starting."
    main(args["function"], args["url_slug"])



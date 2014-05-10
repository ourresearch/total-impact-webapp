from totalimpactwebapp.user import User
from totalimpactwebapp import db
import tasks

from sqlalchemy import func
from celery import chain
import time
import argparse




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
        print user.url_slug
        tasks.add_profile_deets.delay(user)


def deduplicate_everyone():
    for user in page_query(User.query.order_by(User.url_slug.asc())):
        print user.url_slug
        removed_tiids = tasks.deduplicate.delay(user)




def create_cards_for_everyone(url_slug=None):
    cards = []
    if url_slug:
        user = User.query.filter(func.lower(User.url_slug) == func.lower(url_slug)).first()
        print user.url_slug        
        cards = tasks.create_cards(user)
    else:    
        for user in page_query(User.query.order_by(User.url_slug.asc())):
            print user.url_slug        
            cards = tasks.create_cards.delay(user)
    return cards



def email_report_to_url_slug(url_slug=None):
    if url_slug:
        user = User.query.filter(func.lower(User.url_slug) == func.lower(url_slug)).first()
        print user.url_slug        
        tasks.send_email_report(user, override_with_send=True)



def email_report_to_everyone_who_needs_one():
    for user in page_query(User.query.order_by(User.url_slug.asc())):
        print user.url_slug     
        if (((user.last_email_check is None) or (user.last_email_check - now).days >= 7) and 
            (user.notification_email_frequency != "none")):
            tasks.send_email_report.delay(user, override_with_send)


def main(function, url_slug):
    if function=="create_cards_for_everyone":
        create_cards_for_everyone(url_slug)
    elif function=="email_report_to_everyone_who_needs_one":
        email_report_to_everyone_who_needs_one(url_slug)
    else:
        email_report_to_url_slug(url_slug)




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



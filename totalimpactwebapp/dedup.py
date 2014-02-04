#!/usr/bin/env python
import argparse
import logging, os, sys, random, datetime, time
import requests
from sqlalchemy.sql import text    

from totalimpactwebapp import db

logger = logging.getLogger('ti.updater')
logger.setLevel(logging.DEBUG)

# run in heroku by a) commiting, b) pushing to heroku, and c) running
# heroku run python totalimpact/updater.py



def update_by_url_slugs(url_slugs, webapp_api_endpoint):
    QUEUE_DELAY_IN_SECONDS = 0
    count = 0
    for url_slug in url_slugs:
        count += 1
        url = webapp_api_endpoint + u"/user/{url_slug}/products?action=deduplicate&source=scheduled".format(
            url_slug=url_slug)
        try:
            print u"going to post to this url", url
        except UnicodeEncodeError:
            print "UnicodeEncodeError when trying to print url"
        print "REALLY POSTING"
        r = requests.post(url)
        print r.text
        print "n=", count, "of", len(url_slugs), "which is", (100.0*count)/len(url_slugs), "%"
        time.sleep(QUEUE_DELAY_IN_SECONDS)
    print "that was n=", len(url_slugs), "url slugs"
    return url_slugs


def get_profiles_not_updated_since(number_to_update, max_days_since_updated, now=datetime.datetime.utcnow()):
    raw_sql = text(u"""SELECT url_slug FROM "user" u
                        where email is not null
                        ORDER BY url_slug asc
                        LIMIT :number_to_update""")

    # ORDER BY last_refreshed ASC, url_slug

    result = db.session.execute(raw_sql, params={
        "max_days_since_updated": max_days_since_updated, 
        "number_to_update": number_to_update
        })
    url_slugs = [row["url_slug"] for row in result]

    return url_slugs


def by_profile(number_to_update, webapp_api_endpoint, max_days_since_updated, now=datetime.datetime.utcnow()):
    max_days_since_updated = 2
    url_slugs = get_profiles_not_updated_since(number_to_update, max_days_since_updated, now)
    try:    
        print u"got", len(url_slugs), url_slugs
    except UnicodeEncodeError:
        print "UnicodeEncodeError in by_profile"
    update_by_url_slugs(url_slugs, webapp_api_endpoint)
    return url_slugs


def main(action_type, number_to_update=3, max_days_since_updated=7):
    #35 every 10 minutes is 35*6perhour*24hours=5040 per day

    print u"running " + action_type

    try:
        if action_type == "by_profile":
            webapp_api_endpoint = "http://impactstory.org"
            by_profile(number_to_update, webapp_api_endpoint, max_days_since_updated)
    except (KeyboardInterrupt, SystemExit): 
        # this approach is per http://stackoverflow.com/questions/2564137/python-how-to-terminate-a-thread-when-main-program-ends
        sys.exit()
 
if __name__ == "__main__":

    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run periodic metrics updating from the command line")
    action_type = "by_profile"
    parser.add_argument('--number_to_update', default='5000', type=int, help="Number to update.")
    parser.add_argument('--max_days_since_updated', default='0', type=int, help="Update if hasn't been updated in this many days.")
    args = vars(parser.parse_args())
    print args
    print u"updater.py starting."
    main(action_type, args["number_to_update"], args["max_days_since_updated"])






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



def update_by_url_slugs(url_slugs):
    QUEUE_DELAY_IN_SECONDS = 0.25
    for url_slug in url_slugs:
        url = u"http://localhost:5000/user/{url_slug}/products?action=refresh&source=scheduled".format(
            url_slug=url_slug)
        requests.post(url)
        time.sleep(QUEUE_DELAY_IN_SECONDS)
    return url_slugs


def get_profiles_not_updated_since(number_to_update, now=datetime.datetime.utcnow()):
    raw_sql = text(u"""SELECT url_slug FROM "user" u
                        WHERE last_refreshed < now()::date - :max_days_since_updated
                        ORDER BY last_refreshed ASC, url_slug
                        LIMIT :number_to_update""")

    result = db.session.execute(raw_sql, params={
        "max_days_since_updated": 7, 
        "number_to_update": number_to_update
        })
    url_slugs = [row["url_slug"] for row in result]
    print url_slugs

    return url_slugs


def by_profile(number_to_update, now=datetime.datetime.utcnow()):
    url_slugs = get_profiles_not_updated_since(number_to_update, now)
    print "got", len(url_slugs), url_slugs
    update_by_url_slugs(url_slugs)
    return url_slugs


def main(action_type, number_to_update=3, specific_publisher=None):
    #35 every 10 minutes is 35*6perhour*24hours=5040 per day

    print "running " + action_type

    try:
        if action_type == "by_profile":
            by_profile(number_to_update)
    except (KeyboardInterrupt, SystemExit): 
        # this approach is per http://stackoverflow.com/questions/2564137/python-how-to-terminate-a-thread-when-main-program-ends
        sys.exit()
 
if __name__ == "__main__":

    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run periodic metrics updating from the command line")
    action_type = "by_profile"
    parser.add_argument('--number_to_update', default='3', type=int, help="Number to update.")
    args = vars(parser.parse_args())
    print args
    print "updater.py starting."
    main(action_type, args["number_to_update"])



# (WITH max_collect AS 
#     (SELECT tiid, provider, metric_name, max(collected_date) AS collected_date
#         FROM metric
#         WHERE tiid in ('000f5d8btzu1ytmgidsa7kae', '00097c5mm59qiht6tyoa4h5c')
#         GROUP BY tiid, provider, metric_name)
# SELECT 'max' as q, max_collect.*,m.raw_value, m.drilldown_url
#     FROM metric m
#     NATURAL JOIN max_collect)
# UNION ALL
# (WITH min_collect AS 
#     (SELECT tiid, provider, metric_name, max(collected_date) AS collected_date
#         FROM metric
#         WHERE tiid in ('000f5d8btzu1ytmgidsa7kae', '00097c5mm59qiht6tyoa4h5c')
#         AND collected_date < now()::date - 7
#         GROUP BY tiid, provider, metric_name)
# SELECT 'min' as q, min_collect.*,m.raw_value, m.drilldown_url
#     FROM metric m
#     NATURAL JOIN min_collect )
# order by tiid, provider, metric_name, q





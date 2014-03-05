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


def get_user_about_dict(url_slug, webapp_api_endpoint):
    url = webapp_api_endpoint + u"/user/{url_slug}/about".format(
        url_slug=url_slug)
    about = requests.get(url).json()["about"]
    return about

def get_num_products_by_url_slug(url_slug, webapp_api_endpoint):
    return get_user_about_dict(url_slug, webapp_api_endpoint)["products_count"]

def refresh_by_url_slug(url_slug, webapp_api_endpoint):
    url = webapp_api_endpoint + u"/user/{url_slug}/products?action=refresh&source=scheduled".format(
        url_slug=url_slug)
    # try:
    #     logger.debug(u"REFRESH POST to {url}".format(
    #         url=url))
    # except UnicodeEncodeError:
    #     logger.debug(u"UnicodeEncodeError when trying to print url")
    r = requests.post(url)
    return r

def deduplicate_by_url_slug(url_slug, webapp_api_endpoint):
    url = webapp_api_endpoint + u"/user/{url_slug}/products?action=deduplicate&source=scheduled".format(
        url_slug=url_slug)
    # try:
    #     logger.debug(u"DEDUP POST to {url}".format(
    #         url=url))
    # except UnicodeEncodeError:
    #     logger.debug(u"UnicodeEncodeError when trying to print url")
    r = requests.post(url)
    return r    


def import_products_by_url_slug(url_slug, webapp_api_endpoint):
    user_about = get_user_about_dict(url_slug, webapp_api_endpoint)

    for account_type in ["github", "slideshare", "figshare", "orcid"]:
        user_account_value = user_about[account_type+"_id"]
        if user_account_value:
            print user_account_value
            url = webapp_api_endpoint + u"/user/{url_slug}/linked-accounts/{account_type}?action=update".format(
                url_slug=url_slug,
                account_type=account_type)
            try:
                logger.debug(u"LINKED-ACCOUNTS POST to {url}".format(
                    url=url))
            except UnicodeEncodeError:
                logger.debug(u"UnicodeEncodeError when trying to print url")
            r = requests.post(url, 
                    headers={'Content-type': 'application/json', 'Accept': 'application/json'})

            print r.json()

    return True


def get_url_slugs_since_refresh_date(number_to_update, max_days_since_updated, now=datetime.datetime.utcnow()):
    raw_sql = text(u"""SELECT url_slug FROM "user" u
                        WHERE last_refreshed < now()::date - :max_days_since_updated
                        ORDER BY last_refreshed ASC, url_slug
                        LIMIT :number_to_update""")

    result = db.session.execute(raw_sql, params={
        "max_days_since_updated": max_days_since_updated, 
        "number_to_update": number_to_update
        })
    url_slugs = [row["url_slug"] for row in result]

    return url_slugs



def main(number_to_update=3, max_days_since_updated=7):
    #35 every 10 minutes is 35*6perhour*24hours=5040 per day

    try:
        webapp_api_endpoint = os.getenv("WEBAPP_ROOT_PRETTY", "http://localhost:5000")
        now=datetime.datetime.utcnow()

        url_slugs = get_url_slugs_since_refresh_date(number_to_update, max_days_since_updated, now)
        try:    
            print u"got", len(url_slugs), url_slugs
        except UnicodeEncodeError:
            print u"got", len(url_slugs), "UnicodeEncodeError in by_profile"

        for url_slug in url_slugs:
            number_products_before = get_num_products_by_url_slug(url_slug, webapp_api_endpoint)
            import_products_by_url_slug(url_slug, webapp_api_endpoint)
            if get_num_products_by_url_slug(url_slug, webapp_api_endpoint) > 0:
                deduplicate_by_url_slug(url_slug, webapp_api_endpoint)
                refresh_by_url_slug(url_slug, webapp_api_endpoint)
            number_products_after = get_num_products_by_url_slug(url_slug, webapp_api_endpoint)
            if number_products_before==number_products_after:
                logger.info(u"***NO CHANGE on update for {url_slug}, {number_products_before} products".format(
                    number_products_before=number_products_before,
                    url_slug=url_slug))
            else:
                logger.info(u"***BEFORE={number_products_before}, AFTER={number_products_after}; {percent} for {url_slug}".format(
                    number_products_before=number_products_before,
                    number_products_after=number_products_after,
                    percent=100.0*(number_products_after-number_products_before)/number_products_before,
                    url_slug=url_slug))

    except (KeyboardInterrupt, SystemExit): 
        # this approach is per http://stackoverflow.com/questions/2564137/python-how-to-terminate-a-thread-when-main-program-ends
        sys.exit()
 


if __name__ == "__main__":
    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run periodic metrics updating from the command line")
    parser.add_argument('--number_to_update', default='3', type=int, help="Number to update.")
    parser.add_argument('--max_days_since_updated', default='7', type=int, help="Update if hasn't been updated in this many days.")
    args = vars(parser.parse_args())
    print args
    print u"updater.py starting."
    main(args["number_to_update"], args["max_days_since_updated"])



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





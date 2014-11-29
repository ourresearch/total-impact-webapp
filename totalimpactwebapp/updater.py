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


def get_profile(url_slug, webapp_api_endpoint):
    url = u"{webapp_api_endpoint}/profile/{url_slug}".format(
        webapp_api_endpoint=webapp_api_endpoint, url_slug=url_slug)
    return requests.get(url).json()

def get_num_products_by_url_slug(url_slug, webapp_api_endpoint):
    return get_profile(url_slug, webapp_api_endpoint)["product_count"]

def refresh_by_url_slug(url_slug, webapp_api_endpoint):
    url = u"{webapp_api_endpoint}/profile/{url_slug}/products?action=refresh&source=scheduled".format(
        webapp_api_endpoint=webapp_api_endpoint, url_slug=url_slug)
    # try:
    #     logger.debug(u"REFRESH POST to {url}".format(
    #         url=url))
    # except UnicodeEncodeError:
    #     logger.debug(u"UnicodeEncodeError when trying to print url")
    r = requests.post(url)
    return r

def deduplicate_by_url_slug(url_slug, webapp_api_endpoint):
    url = u"{webapp_api_endpoint}/profile/{url_slug}/products?action=deduplicate&source=scheduled".format(
        webapp_api_endpoint=webapp_api_endpoint, url_slug=url_slug)
    # try:
    #     logger.debug(u"DEDUP POST to {url}".format(
    #         url=url))
    # except UnicodeEncodeError:
    #     logger.debug(u"UnicodeEncodeError when trying to print url")
    r = requests.post(url)
    return r    


def import_products_by_url_slug(url_slug, webapp_api_endpoint):
    profile_dict = get_profile(url_slug, webapp_api_endpoint)

    for account_type in ["github", "slideshare", "figshare", "orcid", "twitter", "publons"]:
        user_account_value = profile_dict["about"][account_type+"_id"]
        if user_account_value:
            url = u"{webapp_api_endpoint}/profile/{url_slug}/linked-accounts/{account_type}?action=update&source=scheduled".format(
                webapp_api_endpoint=webapp_api_endpoint, url_slug=url_slug,
                account_type=account_type)
            try:
                logger.debug(u"LINKED-ACCOUNTS POST to {url} with value {user_account_value}".format(
                    url=url, user_account_value=user_account_value))
            except UnicodeEncodeError:
                logger.debug(u"UnicodeEncodeError when trying to print url")
            r = requests.post(url, 
                    headers={'Content-type': 'application/json', 'Accept': 'application/json'})

            if r.status_code==200:
                print "in import_products_by_url_slug", r.json()
            elif r.status_code==404:
                print "after import, no new products"
            else:
                print "error importing products with url {url}, status={status}".format(
                    url=url, status=r.status_code)

    return True



def get_url_slugs_with_past_next_refresh_date(number_to_update, max_days_since_updated, now=datetime.datetime.utcnow()):
    raw_sql = text(u"""SELECT url_slug FROM profile
                        WHERE next_refresh <= now()::date
                        ORDER BY next_refresh ASC, url_slug
                        LIMIT :number_to_update""")

    result = db.session.execute(raw_sql, params={
        "number_to_update": number_to_update
        })
    url_slugs = [row["url_slug"] for row in result]

    return url_slugs



def main(number_to_update=3, max_days_since_updated=7, url_slugs=[None]):
    #35 every 10 minutes is 35*6perhour*24hours=5040 per day

    try:
        webapp_api_endpoint = os.getenv("WEBAPP_ROOT_PRETTY", "https://localhost:5000")
        now=datetime.datetime.utcnow()

        if url_slugs[0]==None:
            url_slugs = get_url_slugs_with_past_next_refresh_date(number_to_update, max_days_since_updated, now)
        try:    
            print u"got", len(url_slugs), url_slugs
        except UnicodeEncodeError:
            print u"got", len(url_slugs), "UnicodeEncodeError in by_profile"

        for url_slug in url_slugs:
            try:
                number_products_before = get_num_products_by_url_slug(url_slug, webapp_api_endpoint)
                import_products_by_url_slug(url_slug, webapp_api_endpoint)
                # don't need to deduplicate any more
                # deduplicate_by_url_slug(url_slug, webapp_api_endpoint)
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
            except Exception as e:
                logger.exception(e)
                logger.debug(u"Exception in main loop on {url_slug}, so skipping".format(url_slug=url_slug))

    except (KeyboardInterrupt, SystemExit): 
        # this approach is per http://stackoverflow.com/questions/2564137/python-how-to-terminate-a-thread-when-main-program-ends
        sys.exit()
 


if __name__ == "__main__":
    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run periodic metrics updating from the command line")
    parser.add_argument('--url_slug', default=None, type=str, help="url slug")
    parser.add_argument('--number_to_update', default='3', type=int, help="Number to update.")
    parser.add_argument('--max_days_since_updated', default='7', type=int, help="Update if hasn't been updated in this many days.")
    args = vars(parser.parse_args())
    print args
    print u"updater.py starting."
    main(args["number_to_update"], args["max_days_since_updated"], [args["url_slug"]])
    db.session.remove()



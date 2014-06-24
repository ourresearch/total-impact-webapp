from totalimpactwebapp.profile import Profile
from totalimpactwebapp.profile import ProductsFromCore
from totalimpactwebapp import db
from totalimpactwebapp import refset
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
        for elem in q.limit(50).offset(offset):
           r = True
           yield elem
        offset += 50
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





def build_refsets():
    refset_builder = refset.RefsetBuilder()
    for profile in page_query(Profile.query.order_by(Profile.url_slug.asc())):
        ProductsFromCore.clear_cache()
        logger.info(u"build_refsets: on {url_slug}".format(url_slug=profile.url_slug))

        for product in profile.product_objects:
            year = product.year
            if year < "2000":
                year = "pre2000"

            product_key = (year, product.genre, product.host, product.mendeley_discipline_name)                

            refset_builder.record_product(product_key)

            for metric in product.metrics:
                try:
                    raw_value = metric.most_recent_snap.raw_value
                    if not isinstance(raw_value, (int, long, float)):
                        # is a dict or something, so histograms don't make sense.  skip.
                        continue
                except AttributeError:
                    raw_value = 0

                metric_key = product_key + (metric.provider, metric.interaction)
                refset_builder.record_metric(metric_key, raw_value)

    print "************"
    # for metric_key in refset_builder.metric_keys:
    #     print metric_key, "=", refset_builder.counters[metric_key].most_common()

    # for metric_key in refset_builder.metric_keys:
    #     print metric_key, "=", refset_builder.percentiles(metric_key)

    print "remvoving old ones"
    # as per http://stackoverflow.com/questions/16573802/flask-sqlalchemy-how-to-delete-all-rows-in-a-single-table
    refset.Refset.query.delete()
    db.session.commit()

    #adding new ones
    print "adding new ones"
    refset_objects = refset_builder.export_histograms()
    for refset_obj in refset_objects:
        db.session.add(refset_obj)
    db.session.commit()
    print "done adding"


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
    elif function=="refsets":
        build_refsets()



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
    



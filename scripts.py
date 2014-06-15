import stripe
import csv
import random
import logging
from totalimpactwebapp.user import User
from totalimpactwebapp import db

logger = logging.getLogger("tiwebapp.scripts")

"""
requires these env vars be set in this environment:
DATABASE_URL
STRIPE_API_KEY
"""


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


def mint_stripe_customers_for_all_users():

    for user in page_query(User.query):

        if user.stripe_id:
            print "Already a Stripe customer for {email}; skipping".format(
                email=user.email
            )
            continue


        print "making a Stripe customer for {email} ".format(email=user.email)
        full_name = "{first} {last}".format(
            first=user.given_name,
            last=user.surname
        )
        stripe_customer = stripe.Customer.create(
            description=full_name,
            email=user.email,
            plan="Premium"
        )

        print "Successfully made stripe id " + stripe_customer.id

        user.stripe_id = stripe_customer.id
        db.session.merge(user)

    print "Done minting Stripe customer; committing users to db."
    db.session.commit()
    print "Comitted to db. All donesies!"


def write_500_random_profile_urls():
    urls = []
    sample_size = 500
    for user in page_query(User.query):
        products_count = len(user.tiids)
        if products_count > 0:
            url = "https://staging-impactstory.org/" + user.url_slug
            urls.append([products_count, url])
            logger.info(u"getting a new profile url out: {url}".format(
                url=url
            ))

    sampled_urls = random.sample(urls, sample_size)

    logger.info(u"writing our {sample_size} sampled profile URLs".format(
        sample_size=sample_size
    ))

    for row in sampled_urls:
        try:
            print "{products_count},{url}".format(
                products_count=row[0],
                url=row[1]
            )
        except UnicodeEncodeError:
            pass  # whatever, we don't need exactly 500



write_500_random_profile_urls()
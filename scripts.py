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
    csv_filename = "totalimpactwebapp/static/500_random_profile_urls.csv"

    with open(csv_filename, "w") as csv_file:
        logger.info("writing our {sample_size} sampled profile URLs to {csv_filename}".format(
            sample_size=sample_size,
            csv_filename=csv_filename
        ))
        new_csv = csv.writer(csv_file, delimiter=',',
                                quotechar='"', quoting=csv.QUOTE_MINIMAL)

        for row in sampled_urls:
            try:
                new_csv.writerow(row)
            except UnicodeEncodeError:
                pass




write_500_random_profile_urls()
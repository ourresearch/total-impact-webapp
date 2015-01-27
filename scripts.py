"""
Scripts for doing stuff
"""

# this is needed to run on Jason's machine
import config
config.set_env_vars_from_dot_env()

# these are the regular 'ol imports
import stripe
import random
import logging
import os
from totalimpactwebapp.profile import Profile
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


def mint_stripe_customers_for_all_profiles():

    stripe.api_key = os.getenv("STRIPE_API_KEY")

    for profile in page_query(Profile.query.order_by(Profile.email.asc())):

        if profile.stripe_id:
            print u"Already a Stripe customer for {email}; skipping".format(
                email=profile.email
            )
            continue


        full_name = u"{first} {last}".format(
            first=profile.given_name,
            last=profile.surname
        )
        if profile.is_advisor:
            print u"making an Advisor Stripe customer for {email} ".format(email=profile.email)
            stripe_customer = stripe.Customer.create(
                description=full_name,
                email=profile.email,
                plan="base",
                coupon="ADVISOR_96309"
            )
        else:
            print u"making a regular Stripe customer for {email} ".format(email=profile.email)            
            stripe_customer = stripe.Customer.create(
                description=full_name,
                email=profile.email,
                plan="base" 
            )

        print u"Successfully made stripe id " + stripe_customer.id

        profile.stripe_id = stripe_customer.id
        db.session.merge(profile)
        db.session.commit()


def delete_if_not_subscribed(stripe_customer):
    print u"calling delete_if_not_subscribed() on customer '{name}' ({email})".format(
        name=stripe_customer.description,
        email=stripe_customer.email
    )

    if stripe_customer.subscriptions.total_count == 0:
        pass
    else:
        print u"this user has a subscription, they get to stay in Stripe"

    return True


def apply_to_stripe_customers(func, starting_after=None):
    """
    Apply a given function to every one of our Stripe customers in turn.

    The supplied function must take one argument, a Stripe Customer object.
    """

    print u"calling apply_to_stripe_customers({func_name}, starting_after={starting_after})".format(
        func_name=func,
        starting_after=starting_after
    )

    # get a page of customers
    resp = stripe.Customer.all(limit=100, starting_after=starting_after)

    # do something with each customer
    for customer in resp.data:
        func(customer)

    # load another page if we're not done yet
    if resp.has_more:
        last_customer_on_page = resp.data[-1]
        apply_to_stripe_customers(func, starting_after=last_customer_on_page.id)



def write_500_random_profile_urls():
    urls = []
    sample_size = 500
    for profile in page_query(Profile.query):
        products_count = len(profile.tiids)
        if products_count > 0:
            url = "https://staging-impactstory.org/" + profile.url_slug
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



#mint_stripe_customers_for_all_profiles()
print "i am running"
apply_to_stripe_customers(delete_if_not_subscribed)













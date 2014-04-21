import stripe
from totalimpactwebapp.user import User
from totalimpactwebapp import db

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


mint_stripe_customers_for_all_users()
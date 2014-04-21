import stripe
from totalimpactwebapp.user import User
from totalimpactwebapp import db

"""
requires these env vars be set in this environment:
DATABASE_URL
STRIPE_API_KEY
"""

def mint_stripe_customers_for_all_users():

    for user in db.session.Query(User):

        if user.stripe_id:
            print "Already a Stripe customer for {email}; skipping".format(
                email=user.email
            )
            continue


        print "making a Stripe customer for " + user.email
        stripe_customer = stripe.Customer.create(
            description=user.given_name + " " + user.surname,
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
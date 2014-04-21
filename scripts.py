import stripe
from totalimpactwebapp.user import get_all_users
from totalimpactwebapp import db


def mint_stripe_customers_for_all_users():
    users = get_all_users()

    # TODO this is just for testing; use all the users in production
    users = users[0:4]

    print "Minting and saving Stripe customer IDs for all {count} " \
          "users...".format(count=len(users))

    for user in users:

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
from totalimpactwebapp.user import User
from totalimpactwebapp import db
from totalimpactwebapp.card_generate import ProductNewMetricCardGenerator
import tasks

import datetime
from sqlalchemy.exc import IntegrityError, DataError, InvalidRequestError
from sqlalchemy.orm.exc import FlushError




"""
requires these env vars be set in this environment:
DATABASE_URL
"""




def page_query(q):
    offset = 0
    while True:
        r = False
        for elem in q.limit(100).offset(offset):
           r = True
           yield elem
        offset += 100
        if not r:
            break

def add_profile_deets_for_everyone():
    for user in page_query(User.query.order_by(User.url_slug.asc())):
        print user.url_slug
        tasks.add_profile_deets.delay(user)


def deduplicate_everyone():
    for user in page_query(User.query.order_by(User.url_slug.asc())):
        print user.url_slug
        removed_tiids = tasks.deduplicate.delay(user)



def create_cards():
    for user in page_query(User.query.order_by(User.url_slug.asc())):
        cards = []
        cards += ProductNewMetricCardGenerator.make(user)

        for card in cards:
            print "writing card", card
            db.session.add(card)
        
        try:
            db.session.commit()
        except InvalidRequestError:
            db.session.rollback()
            db.session.commit()



db.create_all()
create_cards()



from totalimpactwebapp.user import User
from totalimpactwebapp import db
import tasks




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



def create_cards_for_everyone():
    for user in page_query(User.query.order_by(User.url_slug.asc())):
        tasks.create_cards.delay(user)




db.create_all()
add_profile_deets_for_everyone()



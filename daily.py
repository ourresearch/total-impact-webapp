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
        print user.url_slug        
        tasks.create_cards.delay(user)




db.create_all()
create_cards_for_everyone()


# if __name__ == "__main__":
#     # get args from the command line:
#     parser = argparse.ArgumentParser(description="Run periodic metrics updating from the command line")
#     parser.add_argument('--url_slug', default=None, type=str, help="url slug")
#     parser.add_argument('--number_to_update', default='3', type=int, help="Number to update.")
#     parser.add_argument('--max_days_since_updated', default='7', type=int, help="Update if hasn't been updated in this many days.")
#     args = vars(parser.parse_args())
#     print args
#     print u"updater.py starting."
#     main(args["number_to_update"], args["max_days_since_updated"], [args["url_slug"]])



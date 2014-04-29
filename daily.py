from totalimpactwebapp.user import User
from totalimpactwebapp import db
import datetime

from tasks import update_from_linked_account


"""
requires these env vars be set in this environment:
DATABASE_URL
"""

# TBD
# should this be in webapp library?  if not, implications for logging
# should we have a library for these scripts, somewhere to put page_query?

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


def put_linked_account_users_on_queue():

    i = 0
    # now = datetime.datetime.utcnow().isoformat()
    now = "2013-06-24"
    # for user in page_query(User.query.filter(User.next_refresh < now).order_by(User.next_refresh.asc())):

    # for user in page_query(User.query):
    for user in page_query(User.query.filter(User.next_refresh <= now)):
        linked_accounts_to_sync = {
            "figshare": user.figshare_id, 
            "github": user.github_id, 
            "orcid": user.orcid_id, 
            "slideshare": user.slideshare_id 
        }
        has_linked_account = [account for account in linked_accounts_to_sync if linked_accounts_to_sync[account]]
        if has_linked_account:
            i += 1
            print u"{i} user {url_slug} has linked account: {has_linked_account} {next_refresh} ".format(
                i=i, url_slug=user.url_slug, has_linked_account=has_linked_account, next_refresh=user.next_refresh)
            for account in has_linked_account:
                tiids = update_from_linked_account.delay(user, account)    


put_linked_account_users_on_queue()



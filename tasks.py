import os
import datetime
import time
from celery import Celery

from totalimpactwebapp.user import User
from totalimpactwebapp import db
from totalimpactwebapp.user import remove_duplicates_from_user


celery_app = Celery('tasks', 
    broker=os.getenv("CLOUDAMQP_URL", "amqp://guest@localhost//")
    )


# celery_app.conf.update(
#     CELERY_TASK_SERIALIZER='json',
#     CELERY_ACCEPT_CONTENT=['json'],  # Ignore other content
#     CELERY_RESULT_SERIALIZER='json',
#     CELERY_ENABLE_UTC=True,
#     CELERY_TRACK_STARTED=True,
#     CELERY_ACKS_LATE=True, 
# )

@celery_app.task(ignore_result=True)
def deduplicate(user):
    removed_tiids = []
    try:
        removed_tiids = remove_duplicates_from_user(user.id)
        print removed_tiids
    except Exception as e:
        print
        print "EXCEPTION!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", user.id
        print e.message
        print "ON USER", user.url_slug

    return removed_tiids


@celery_app.task(ignore_result=True)
def update_from_linked_account(user, account):
    tiids = user.update_products_from_linked_account(account, update_even_removed_products=False)
    return tiids



import os
import datetime
import time
from celery import Celery

from totalimpactwebapp.user import User
from totalimpactwebapp import products_list
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


class ProfileDeets(db.Model):
    id = db.Column(db.Integer, primary_key=True)    
    user_id = db.Column(db.Integer)
    tiid = db.Column(db.Text)
    provider = db.Column(db.Text)
    metric = db.Column(db.Text)
    current_raw = db.Column(db.Text)
    diff = db.Column(db.Text)
    diff_days = db.Column(db.Text)
    metrics_collected_date = db.Column(db.DateTime())
    deets_collected_date = db.Column(db.DateTime())

    def __init__(self, **kwargs):
        print(u"new ProfileDeets {kwargs}".format(
            kwargs=kwargs))        
        self.deets_collected_date = datetime.datetime.utcnow()    
        super(ProfileDeets, self).__init__(**kwargs)

    def __repr__(self):
        return u'<ProfileDeets {user_id} {tiid}>'.format(
            user_id=self.user_id, 
            tiid=self.tiid)


@celery_app.task(ignore_result=True)
def add_profile_deets(user):
    product_dicts = products_list.prep(
            user.products,
            include_headings=False,
            display_debug=True
        )
    for product in product_dicts:
        tiid = product["_id"]
        for full_metric_name in product["metrics"]:
            if "historical_values" in product["metrics"][full_metric_name]:
                hist = product["metrics"][full_metric_name]["historical_values"]
                (provider, metric) = full_metric_name.split(":")
                if hist["diff"]["raw"]:
                    profile_deets = ProfileDeets(
                        user_id=user.id, 
                        tiid=tiid,
                        provider=provider, 
                        metric=metric,
                        current_raw=hist["current"]["raw"],
                        metrics_collected_date=hist["current"]["collected_date"],
                        diff=hist["diff"]["raw"],
                        diff_days=hist["diff"]["days"]
                    )
                    db.session.add(profile_deets)
    db.session.commit()
    print 1/0


@celery_app.task(ignore_result=True)
def update_from_linked_account(user, account):
    tiids = user.update_products_from_linked_account(account, update_even_removed_products=False)
    return tiids



import os
import datetime
import time
import logging
import celery
from sqlalchemy.exc import IntegrityError, DataError, InvalidRequestError
from sqlalchemy.orm.exc import FlushError

from totalimpactwebapp.user import User
from totalimpactwebapp import products_list
from totalimpactwebapp import db
from totalimpactwebapp.json_sqlalchemy import JSONAlchemy
from totalimpactwebapp.user import remove_duplicates_from_user
from totalimpactwebapp.card_generate import *
from totalimpactwebapp import notification_report
from totalimpactwebapp import emailer

logger = logging.getLogger(__name__)

celery_app = celery.Celery('tasks', 
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

class CeleryStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)    
    user_id = db.Column(db.Integer)
    url_slug = db.Column(db.Text)
    task_uuid = db.Column(db.Text)
    task_name = db.Column(db.Text)
    state = db.Column(db.Text)
    args = db.Column(JSONAlchemy(db.Text))
    kwargs = db.Column(JSONAlchemy(db.Text))
    result = db.Column(JSONAlchemy(db.Text))
    run = db.Column(db.DateTime())

    def __init__(self, **kwargs):
        print(u"new CeleryStatus {kwargs}".format(
            kwargs=kwargs))        
        self.run = datetime.datetime.utcnow()    
        super(CeleryStatus, self).__init__(**kwargs)

    def __repr__(self):
        return u'<CeleryStatus {user_id} {task_name}>'.format(
            user_id=self.user_id, 
            task_name=self.task_name)



# from http://stackoverflow.com/questions/6393879/celery-task-and-customize-decorator
class TaskThatSavesState(celery.Task):

    def __call__(self, *args, **kwargs):
        """In celery task this function call the run method, here you can
        set some environment variable before the run of the task"""
        # logger.info("Starting to run")
        return self.run(*args, **kwargs)

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        #exit point of the task whatever is the state
        # logger.info("Ending run")
        user_id = None
        url_slug = None
        args_to_save = []
        for arg in args:
            args_to_save.append(u"{user_object}".format(user_object=arg))
            if isinstance(arg, User):
                user_id = arg.id
                url_slug = arg.url_slug
        celery_status = CeleryStatus(
            task_name = self.name,
            task_uuid = task_id,
            user_id = user_id,
            url_slug = url_slug,
            state = status,
            args = args_to_save,
            kwargs = kwargs,
            # result = retval  #causing seriializaion problems when failures
            )

        db.session.add(celery_status)
        try:
            db.session.commit()
        except InvalidRequestError:
            db.session.rollback()
            db.session.commit()


class ProfileDeets(db.Model):
    id = db.Column(db.Integer, primary_key=True)    
    user_id = db.Column(db.Integer)
    tiid = db.Column(db.Text)
    provider = db.Column(db.Text)
    metric = db.Column(db.Text)
    current_raw = db.Column(JSONAlchemy(db.Text))
    diff = db.Column(JSONAlchemy(db.Text))
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


@celery_app.task(ignore_result=True, base=TaskThatSavesState)
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


@celery_app.task(ignore_result=True, base=TaskThatSavesState)
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





@celery_app.task(base=TaskThatSavesState)
def send_email_report(user, override_with_send=False):

    template_filler_dict = notification_report.make(user)

    # email = user.email
    email = "jason@impactstory.org"
    # email = "heather@impactstory.org"
    
    msg = emailer.send(email, "Here's your Impactstory report", "report", template_filler_dict)

    user.last_email_check = datetime.datetime.utcnow()

    try:
        db.session.commit()
    except InvalidRequestError:
        db.session.rollback()
        db.session.commit()

    return "success"


# @celery_app.task(base=TaskThatSavesState)
# def update_from_linked_account(user, account):
#     tiids = user.update_products_from_linked_account(account, update_even_removed_products=False)
#     return tiids



# @celery_app.task(base=TaskThatSavesState)
# def link_accounts_and_update(user):
#     all_tiids = []
#     for account in ["github", "slideshare", "figshare", "orcid"]:
#         all_tiids += update_from_linked_account(user, account)  
#     all_tiids += user.refresh_products(source="scheduled")
#     return all_tiids  


# @celery_app.task(base=TaskThatSavesState)
# def dedup_and_create_cards_and_email(user, override_with_send=True):
#     deduplicate(user)
#     # create_cards(user)
#     send_email_report(user, override_with_send=True)


# @celery_app.task(base=TaskThatSavesState)
# def create_cards(user):
#     timestamp = datetime.datetime.utcnow()
#     cards = []
#     cards += ProductNewMetricCardGenerator.make(user, timestamp)
#     cards += ProfileNewMetricCardGenerator.make(user, timestamp)

#     for card in cards:
#         db.session.add(card)
    
#     try:
#         db.session.commit()
#     except InvalidRequestError:
#         db.session.rollback()
    #     db.session.commit()
    # return cards


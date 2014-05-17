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

logger = logging.getLogger("webapp.tasks")

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
        logger.debug(u"new CeleryStatus {kwargs}".format(
            kwargs=kwargs))        
        self.run = datetime.datetime.utcnow()    
        super(CeleryStatus, self).__init__(**kwargs)

    def __repr__(self):
        return u'<CeleryStatus {user_id} {task_name}>'.format(
            user_id=self.user_id, 
            task_name=self.task_name)



class TaskAlertIfFail(celery.Task):

    def __call__(self, *args, **kwargs):
        """In celery task this function call the run method, here you can
        set some environment variable before the run of the task"""
        # logger.info("Starting to run")
        return self.run(*args, **kwargs)

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        url_slug="unknown"
        for arg in args:
            if isinstance(arg, User):
                url_slug = arg.url_slug
        logger.error("Celery task failed on {task_name}, user {url_slug}, task_id={task_id}".format(
            task_name=self.name, url_slug=url_slug, task_id=task_id))


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
        logger.debug(u"new ProfileDeets {kwargs}".format(
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
        logger.debug(removed_tiids)
    except Exception as e:
        logger.debug("EXCEPTION!!!!!!!!!!!!!!!! deduplicating")

    return removed_tiids


@celery_app.task(base=TaskAlertIfFail)
def send_email_if_new_diffs(user):

    # get it again to help with debugging?
    user = User.query.get(user.id)

    status = "started"
    now = datetime.datetime.utcnow()    
    logger.debug(u"in send_email_if_new_diffs for {url_slug}".format(url_slug=user.url_slug))
    latest_diff_timestamp = products_list.latest_diff_timestamp(user.products)
    status = "checking diffs"
    if (latest_diff_timestamp > user.last_email_check.isoformat()):
        logger.debug("has diffs since last email check! calling send_email report for {url_slug}".format(url_slug=user.url_slug))
        send_email_report(user, now)
        status = "email sent"
    else:
        logger.debug(u"not sending, no new diffs since last email sent for {url_slug}".format(url_slug=user.url_slug))
        status = "no new diffs"

    # set last email check
    db.session.merge(user)
    user.last_email_check = now
    try:
        db.session.commit()
        logger.debug(u"updated user object in send_email_if_new_diffs for {url_slug}".format(url_slug=user.url_slug))
    except InvalidRequestError:
        logger.debug(u"rollback, trying again to update user object in send_email_if_new_diffs for {url_slug}".format(url_slug=user.url_slug))
        db.session.rollback()
        db.session.commit()
        logger.debug(u"after rollback updated user object in send_email_if_new_diffs for {url_slug}".format(url_slug=user.url_slug))

    return status



def send_email_report(user, now=None):    
    status = "started"
    if not now:
        now = datetime.datetime.utcnow()
    template_filler_dict = notification_report.make(user)
    db.session.merge(user)

    if template_filler_dict["cards"]:
        if os.getenv("ENVIRONMENT", "testing") == "production":
            email = user.email
        else:
            email = "team@impactstory.org"
        user.last_email_sent = now

        try:
            db.session.commit()
            logger.debug(u"updated user object in send_email_report for {url_slug}".format(url_slug=user.url_slug))
        except InvalidRequestError:
            logger.debug(u"rollback, trying again to update user object in send_email_report for {url_slug}".format(url_slug=user.url_slug))
            db.session.rollback()
            db.session.commit()
            logger.debug(u"after rollback updated user object in send_email_report for {url_slug}".format(url_slug=user.url_slug))

        msg = emailer.send(email, "Your latest research impacts", "report", template_filler_dict)
        status = "emailed"
        logger.debug(u"SENT EMAIL to {url_slug}!!".format(url_slug=user.url_slug))
    else:
        status = "not emailed, no cards made"
        logger.debug(u"not sending email, no cards made for {url_slug}".format(url_slug=user.url_slug))

    return status


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


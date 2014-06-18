import logging
import celery
from celery.decorators import task
from celery.signals import task_postrun, task_prerun, task_failure, worker_process_init

from sqlalchemy.exc import IntegrityError, DataError, InvalidRequestError

from totalimpactwebapp.profile import Profile
from totalimpactwebapp import db
from totalimpactwebapp.json_sqlalchemy import JSONAlchemy
from totalimpactwebapp.profile import remove_duplicates_from_profile
from totalimpactwebapp.card_generate import *
from totalimpactwebapp import notification_report
from totalimpactwebapp import emailer
from totalimpactwebapp.profile import ProductsFromCore


logger = logging.getLogger("webapp.tasks")





@task_postrun.connect()
def task_postrun_handler(*args, **kwargs):    
    # close db session
    db.session.remove()


@task_failure.connect
def task_failure_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, retval=None, state=None, **kwds):
    try:
        logger.error(u"Celery task FAILED on task_id={task_id}, {args}".format(
            task_id=task_id, args=args))
    except KeyError:
        pass


class CeleryStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)    
    profile_id = db.Column(db.Integer)
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
        return u'<CeleryStatus {profile_id} {task_name}>'.format(
            profile_id=self.profile_id,
            task_name=self.task_name)



class TaskAlertIfFail(celery.Task):

    def __call__(self, *args, **kwargs):
        """In celery task this function call the run method, here you can
        set some environment variable before the run of the task"""
        # logger.info(u"Starting to run")
        return self.run(*args, **kwargs)

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        if not "profile_id" in args:
            profile_id = "unknown"
        logger.error(u"Celery task failed on {task_name}, profile {profile_id}, task_id={task_id}".format(
            task_name=self.name, profile_id=profile_id, task_id=task_id))


# from http://stackoverflow.com/questions/6393879/celery-task-and-customize-decorator
class TaskThatSavesState(celery.Task):

    def __call__(self, *args, **kwargs):
        """In celery task this function call the run method, here you can
        set some environment variable before the run of the task"""
        # logger.info(u"Starting to run")
        return self.run(*args, **kwargs)

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        #exit point of the task whatever is the state
        # logger.info(u"Ending run")
        profile_id = None
        url_slug = None
        args_to_save = []
        for arg in args:
            args_to_save.append(u"{profile_object}".format(profile_object=arg))
            if isinstance(arg, Profile):
                profile_id = arg.id
                url_slug = arg.url_slug
        celery_status = CeleryStatus(
            task_name = self.name,
            task_uuid = task_id,
            profile_id = profile_id,
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
    profile_id = db.Column(db.Integer)
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
        return u'<ProfileDeets {profile_id} {tiid}>'.format(
            profile_id=self.profile_id,
            tiid=self.tiid)


# this commented stuff is all really out of date as of jun 8,
# but i'm leaving alone because it's commented out. -j

# @task(ignore_result=True, base=TaskThatSavesState)
# def add_profile_deets(profile):
#     product_dicts = products_list.prep(
#             profile.products,
#             include_headings=False,
#             display_debug=True
#         )
#     for product in product_dicts:
#         tiid = product["_id"]
#         for full_metric_name in product["metrics"]:
#             if "historical_values" in product["metrics"][full_metric_name]:
#                 hist = product["metrics"][full_metric_name]["historical_values"]
#                 (provider, metric) = full_metric_name.split(":")
#                 if hist["diff"]["raw"]:
#                     profile_deets = ProfileDeets(
#                         profile_id=profile.id,
#                         tiid=tiid,
#                         provider=provider, 
#                         metric=metric,
#                         current_raw=hist["current"]["raw"],
#                         metrics_collected_date=hist["current"]["collected_date"],
#                         diff=hist["diff"]["raw"],
#                         diff_days=hist["diff"]["days"]
#                     )
#                     db.session.add(profile_deets)
#     db.session.commit()


@task(ignore_result=True, base=TaskThatSavesState)
def deduplicate(profile):
    removed_tiids = []
    try:
        removed_tiids = remove_duplicates_from_profile(profile.id)
        logger.debug(removed_tiids)
    except Exception as e:
        logger.warning(u"EXCEPTION!!!!!!!!!!!!!!!! deduplicating")

    return removed_tiids


@task(base=TaskAlertIfFail)
def send_email_if_new_diffs(profile_id):

    profile = db.session.query(Profile).get(profile_id)
    ProductsFromCore.clear_cache()

    status = "started"
    now = datetime.datetime.utcnow()    
    logger.debug(u"in send_email_if_new_diffs for {url_slug}".format(url_slug=profile.url_slug))
    latest_diff_timestamp = profile.latest_diff_ts
    status = "checking diffs"

    if (not profile.last_email_check) or (latest_diff_timestamp > profile.last_email_check.isoformat()):
        logger.info(u"has diffs since last email check! calling send_email report for {url_slug}".format(url_slug=profile.url_slug))
        send_email_report(profile, now)
        status = "email sent"
    else:
        logger.info(u"not sending, no new diffs since last email sent for {url_slug}".format(url_slug=profile.url_slug))
        status = "no new diffs"

    # set last email check date
    db.session.merge(profile)
    profile.last_email_check = now
    try:
        db.session.commit()
        logger.info(u"updated profile object in send_email_if_new_diffs for {url_slug}".format(url_slug=profile.url_slug))
    except InvalidRequestError:
        logger.info(u"rollback, trying again to update profile object in send_email_if_new_diffs for {url_slug}".format(url_slug=profile.url_slug))
        db.session.rollback()
        db.session.commit()
        logger.info(u"after rollback updated profile object in send_email_if_new_diffs for {url_slug}".format(url_slug=profile.url_slug))

    return status



def send_email_report(profile, now=None):
    status = "started"
    if not now:
        now = datetime.datetime.utcnow()
    template_filler_dict = notification_report.make(profile)
    db.session.merge(profile)

    if template_filler_dict["cards"]:
        if os.getenv("ENVIRONMENT", "testing") == "production":
            email = profile.email
        else:
            email = "team@impactstory.org"
        profile.last_email_sent = now

        try:
            db.session.commit()
            logger.info(u"updated profile object in send_email_report for {url_slug}".format(url_slug=profile.url_slug))
        except InvalidRequestError:
            logger.info(u"rollback, trying again to update profile object in send_email_report for {url_slug}".format(url_slug=profile.url_slug))
            db.session.rollback()
            db.session.commit()
            logger.info(u"after rollback updated profile object in send_email_report for {url_slug}".format(url_slug=profile.url_slug))

        msg = emailer.send(email, "Your latest research impacts", "report", template_filler_dict)
        status = "emailed"
        logger.info(u"SENT EMAIL to {url_slug}!!".format(url_slug=profile.url_slug))
    else:
        status = "not emailed, no cards made"
        logger.info(u"not sending email, no cards made for {url_slug}".format(url_slug=profile.url_slug))

    return status


# @task(base=TaskThatSavesState)
# def update_from_linked_account(profile, account):
#     tiids = profile.update_products_from_linked_account(account, update_even_removed_products=False)
#     return tiids



# @task(base=TaskThatSavesState)
# def link_accounts_and_update(profile):
#     all_tiids = []
#     for account in ["github", "slideshare", "figshare", "orcid"]:
#         all_tiids += update_from_linked_account(profile, account)
#     all_tiids += profile.refresh_products(source="scheduled")
#     return all_tiids  


# @task(base=TaskThatSavesState)
# def dedup_and_create_cards_and_email(profile, override_with_send=True):
#     deduplicate(profile)
#     # create_cards(profile)
#     send_email_report(profile, override_with_send=True)


# @task(base=TaskThatSavesState)
# def create_cards(profile):
#     timestamp = datetime.datetime.utcnow()
#     cards = []
#     cards += ProductNewMetricCardGenerator.make(profile, timestamp)
#     cards += ProfileNewMetricCardGenerator.make(profile, timestamp)

#     for card in cards:
#         db.session.add(card)
    
#     try:
#         db.session.commit()
#     except InvalidRequestError:
#         db.session.rollback()
    #     db.session.commit()
    # return cards


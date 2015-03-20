import time 
import os
import json
import logging
import datetime
import random
import celery
import re
import requests
from celery.decorators import task
from celery.signals import task_postrun, task_prerun, task_failure, worker_process_init
from celery import group, chain, chord
from celery import current_app as celery_app
from celery import Task
from celery.signals import task_sent
from celery.utils import uuid
from eventlet import timeout
from sqlalchemy.orm.exc import FlushError
from sqlalchemy.exc import IntegrityError, DataError, InvalidRequestError

from totalimpactwebapp import db
from totalimpact.tiredis import REDIS_MAIN_DATABASE_NUMBER
from totalimpact import tiredis, default_settings
from totalimpact.providers.provider import ProviderFactory, ProviderError, ProviderTimeout

from totalimpactwebapp.profile import Profile

from totalimpactwebapp.product import add_product_embed_markup
from totalimpactwebapp.product import Product
from totalimpactwebapp.product import put_aliases_in_product
from totalimpactwebapp.product import put_biblio_in_product
from totalimpactwebapp.product import put_snap_in_product

from totalimpactwebapp.aliases import alias_dict_from_tuples
from totalimpactwebapp.aliases import alias_tuples_from_dict
from totalimpactwebapp.aliases import canonical_aliases
from totalimpactwebapp.aliases import merge_alias_dicts

from totalimpactwebapp.profile import get_profile_from_id

from totalimpactwebapp.refresh_status import RefreshStatus
from totalimpactwebapp.refresh_status import save_profile_refresh_status

from util import commit 

import rate_limit

logger = logging.getLogger("ti.core_tasks")
myredis = tiredis.from_url(os.getenv("REDIS_URL"), db=REDIS_MAIN_DATABASE_NUMBER)

rate = rate_limit.RateLimiter(redis_url=os.getenv("REDIS_URL"), redis_db=REDIS_MAIN_DATABASE_NUMBER)
rate.add_condition({'requests':25, 'seconds':1})


# from https://github.com/celery/celery/issues/1671#issuecomment-47247074
# pending this being fixed in useful celery version
"""
Monkey patch for celery.chord.type property
"""
def _type(self):
    if self._type:
        return self._type
    if self._app:
        app = self._app
    else:
        try:
            app = self.tasks[0].type.app
        except (IndexError, AttributeError):
            app = self.body.type.app
    return app.tasks['celery.chord']
from celery import canvas
canvas.chord.type = property(_type)
#### end monkeypatch


def say_hi(my_return, my_sleep=0):
    import time
    time.sleep(my_sleep)
    return "Hi " + my_return + str(my_sleep)


class ClearDbSessionTask(Task):
    """An abstract Celery Task that ensures that the connection the the
    database is closed on task completion"""
    abstract = True

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        # logger.info(u"Celery task after_return handler, removing session, retval {retval}, args {args}, kwargs={kwargs}".format(
        #     retval=retval, args=args, kwargs=kwargs))
        db.session.remove()

        # this next line has to be here, see http://celery.readthedocs.org/en/latest/userguide/canvas.html
        super(ClearDbSessionTask, self).after_return(status, retval, task_id, args, kwargs, einfo)


    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.info(u"Celery task on_failure handler, exc {exc}, args {args}, kwargs={kwargs}, einfo={einfo}".format(
            exc=exc, args=args, kwargs=kwargs, einfo=einfo))
        if task_id.startswith("task-provider"):
            tiid = args[0]
            logger.info(u"on_failure handler, calling after_refresh_complete for tiid {tiid}".format(
                tiid=tiid))
            failure_message = u"exc={exc}, args={args}, kwargs={kwargs}, time={time}, einfo={einfo}".format(
                time=datetime.datetime.utcnow(), exc=exc, args=args, kwargs=kwargs, einfo=einfo)
            after_refresh_complete(tiid, failure_message=failure_message)












def sniffer(genre, host, item_aliases, provider_config=default_settings.PROVIDERS):

    all_metrics_providers = [provider.provider_name for provider in 
                    ProviderFactory.get_providers(provider_config, "metrics")]
    if "arxiv" in item_aliases:
        # for these purposes
        host = "arxiv"

    if (genre == "article") and (host != "arxiv"):
        run = [[("aliases", provider)] for provider in ["mendeley", "crossref", "pubmed", "altmetric_com"]]
        run += [[("biblio", provider) for provider in ["crossref", "pubmed", "mendeley", "webpage"]]]
        run += [[("metrics", provider) for provider in all_metrics_providers]]
    elif (host == "arxiv") or ("doi" in item_aliases):
        run = [[("aliases", provider)] for provider in [host, "altmetric_com"]]
        run += [[("biblio", provider) for provider in [host, "mendeley"]]]
        run += [[("metrics", provider) for provider in all_metrics_providers]]
    else:
        # relevant alias and biblio providers are always the same
        relevant_providers = [host]
        if relevant_providers == ["unknown"]:
            relevant_providers = ["webpage"]
        run = [[("aliases", provider)] for provider in relevant_providers]
        run += [[("biblio", provider) for provider in relevant_providers]]
        run += [[("metrics", provider) for provider in all_metrics_providers]]

    return(run)



@task(priority=0)
def chain_dummy(first_arg, **kwargs):
    if isinstance(first_arg, list):
        response = first_arg[0]
    else:
        response = first_arg

    return response




@task(base=ClearDbSessionTask)
def done_all_refreshes(profile_id):   
    print "\n\n-------> done all refreshes", profile_id, "\n\n\n---------------\n\n\n"

    profile = Profile.query.get(profile_id)

    save_profile_refresh_status(profile, RefreshStatus.states["CRUNCHING"])

    logger.info(u"deduplicating for {url_slug}".format(
        url_slug=profile.url_slug))
    deleted_tiids = profile.remove_duplicates()

    logger.info(u"parse_and_save_tweets for {url_slug}".format(
        url_slug=profile.url_slug))
    profile.parse_and_save_tweets()

    save_profile_refresh_status(profile, RefreshStatus.states["ALL_DONE"])

    return


@task(priority=0, base=ClearDbSessionTask)
def after_refresh_complete(tiid, failure_message=None):
    # logger.info(u"here in after_refresh_complete with {tiid}".format(
    #     tiid=tiid))

    product = Product.query.get(tiid)

    if not product:
        logger.warning(u"Empty product in after_refresh_complete for tiid {tiid}".format(
           tiid=tiid))
        return None

    product.embed_markup = product.get_embed_markup() 
    product.set_refresh_status(myredis, failure_message)  #need commit after this
    db.session.merge(product)
    commit(db)

    sleep_seconds = random.random() * 10
    logger.info(u"Sleeping {sleep_seconds}s in after_refresh_complete for {tiid} before checking done refreshes".format(
       sleep_seconds=sleep_seconds, tiid=tiid))
    time.sleep(sleep_seconds)

    profile = Profile.query.get(product.profile_id)

    if not profile:
        print "\n\n-------> no profile after done all refreshes?!?", product.profile_id, "\n\n\n---------------\n\n\n"
        return None

    refresh_status = profile.get_refresh_status()

    if refresh_status.is_done_refreshing and refresh_status.refresh_state == "progress bar":
        print "\n\n-------> done all refreshes", product.profile_id, "\n\n\n---------------\n\n\n"

        logger.info(u"just_finished_profile_refresh for {tiid}, now deduping etc".format(
           tiid=tiid))

        save_profile_refresh_status(profile, RefreshStatus.states["CRUNCHING"])

        logger.info(u"deduplicating for {url_slug}".format(
            url_slug=profile.url_slug))
        deleted_tiids = profile.remove_duplicates()

        logger.info(u"parse_and_save_tweets for {url_slug}".format(
            url_slug=profile.url_slug))
        profile.parse_and_save_tweets()

        save_profile_refresh_status(profile, RefreshStatus.states["ALL_DONE"])



@task(base=ClearDbSessionTask)
def get_refresh_tiid_pipeline(tiid, task_priority):   

    product = Product.query.get(tiid)

    if not product:
        logger.warning(u"Empty product in get_refresh_tiid_pipeline for tiid {tiid}".format(
           tiid=tiid))
        return None

    pipeline = sniffer(product.genre, product.host, product.aliases_for_providers)
    chain_list = []
    task_ids = []
    for step_config in pipeline:
        group_list = []
        for (method_name, provider_name) in step_config:
            if not chain_list:
                # pass the tiid in to the first one in the whole chain
                new_task = provider_run.si(tiid, method_name, provider_name).set(priority=3, queue="core_"+task_priority) #don't start new ones till done
            else:
                new_task = provider_run.si(tiid, method_name, provider_name).set(priority=0, queue="core_"+task_priority)
            uuid_bit = uuid().split("-")[0]

            # code above counts on this format of task id, starting with task-provider
            new_task_id = "task-provider-{tiid}-{method_name}-{provider_name}-{uuid}".format(
                tiid=tiid, method_name=method_name, provider_name=provider_name, uuid=uuid_bit)

            group_list.append(new_task.set(task_id=new_task_id))
            task_ids.append(new_task_id)
        if group_list:
            chain_list.append(group(group_list))
            dummy_name = "DUMMY_{method_name}_{provider_name}".format(
                method_name=method_name, provider_name=provider_name)
            chain_list.append(chain_dummy.si(tiid, dummy=dummy_name).set(queue="core_"+task_priority))

    # do this before we kick off the tasks to make sure they are there before tasks finish
    myredis.set_provider_task_ids(tiid, task_ids)

    new_task = after_refresh_complete.si(tiid).set(priority=0, queue="core_"+task_priority)
    uuid_bit = uuid().split("-")[0]
    new_task_id = "task-after-{tiid}-DONE-{uuid}".format(
        tiid=tiid, uuid=uuid_bit)
    chain_list.append(new_task.set(task_id=new_task_id))

    workflow = chain(chain_list)

    # see http://stackoverflow.com/questions/18872854/getting-task-id-inside-a-celery-task
    # workflow_tasks_task.task_id, 
    # logger.info(u"before apply_async for tiid {tiid}, get_refresh_tiid_pipeline id {task_id}".format(
    #     tiid=tiid, task_id=get_refresh_tiid_pipeline.request.id))

    workflow_apply_async = workflow.apply_async(queue="core_"+task_priority)  

    workflow_tasks = workflow.tasks
    workflow_trackable_task = workflow_tasks[-1]  # see http://blog.cesarcd.com/2014/04/tracking-status-of-celery-chain.html
    workflow_trackable_id = workflow_trackable_task.id

    # see http://stackoverflow.com/questions/18872854/getting-task-id-inside-a-celery-task
    # workflow_tasks_task.task_id, 
    # logger.info(u"task id for tiid {tiid}, refresh_tiids id {task_id}, workflow_trackable_id {workflow_trackable_id} task_ids={task_ids}".format(
    #     tiid=tiid, task_id=get_refresh_tiid_pipeline.request.id, workflow_trackable_id=workflow_trackable_id, task_ids=task_ids))

    return workflow





def put_on_celery_queue(profile_id, tiids, task_priority="high"):
    # logger.info(u"put_on_celery_queue {tiid}".format(
    #     tiid=tiid))

    logger.info(u"put_on_celery_queue for {profile_id}".format(
        profile_id=profile_id))

    if not tiids:
        return

    #see http://stackoverflow.com/questions/15239880/task-priority-in-celery-with-redis
    if task_priority == "high":
        priority_number = 6
    else:
        priority_number = 9

    refresh_all_tiids_tasks = []

    for tiid in tiids:
        refresh_a_tiid_tasks = get_refresh_tiid_pipeline(tiid, task_priority)
        # refresh_all_tiids_tasks.append(group(refresh_a_tiid_tasks))

    # if refresh_all_tiids_tasks:
        # end_task = done_all_refreshes.si(profile_id).set(priority=priority_number, queue="core_"+task_priority)
        # chain_list = group(refresh_all_tiids_tasks) | end_task

        # chain_list = group(refresh_all_tiids_tasks)
        # logger.info(u"in put_on_celery_queue, chain_list={chain_list}".format(
        #     chain_list=chain_list))
        # chain_list_apply_async = chain_list.apply_async(queue="core_"+task_priority)


    logger.info(u"after apply_async in put_on_celery_queue for {profile_id}".format(
        profile_id=profile_id))

    return



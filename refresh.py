from totalimpactwebapp.profile import Profile
from totalimpactwebapp.product import Product
from totalimpactwebapp.profile import get_profile_stubs_from_url_slug
from totalimpactwebapp.product import get_no_snaps_orphaned_product
from rq import Queue
from rq.job import Job
from rq_worker import redis_rq_conn
from totalimpact import default_settings
from totalimpact.providers.provider import ProviderFactory, ProviderError, ProviderTimeout
from totalimpactwebapp.product import put_aliases_in_product
from totalimpactwebapp.product import put_biblio_in_product
from totalimpactwebapp.product import put_snap_in_product
from totalimpactwebapp import db
from util import commit 
import sqlalchemy
import logging
import json
import time

logger = logging.getLogger("ti.refresh")


def flat_sniffer(genre, host, item_aliases, provider_config=default_settings.PROVIDERS):

    all_metrics_providers = [provider.provider_name for provider in 
                    ProviderFactory.get_providers(provider_config, "metrics")]
    if "arxiv" in item_aliases:
        # for these purposes
        host = "arxiv"

    if (genre == "article") and (host != "arxiv"):
        run = [("aliases", provider) for provider in ["mendeley", "crossref", "pubmed", "altmetric_com"]]
        run += [("biblio", provider) for provider in ["crossref", "pubmed", "mendeley", "webpage"]]
        run += [("metrics", provider) for provider in all_metrics_providers]
    elif (host == "arxiv") or ("doi" in item_aliases):
        run = [("aliases", provider) for provider in [host, "altmetric_com"]]
        run += [("biblio", provider) for provider in [host, "mendeley"]]
        run += [("metrics", provider) for provider in all_metrics_providers]
    else:
        # relevant alias and biblio providers are always the same
        relevant_providers = [host]
        if relevant_providers == ["unknown"]:
            relevant_providers = ["webpage"]
        run = [("aliases", provider) for provider in relevant_providers]
        run += [("biblio", provider) for provider in relevant_providers]
        run += [("metrics", provider) for provider in all_metrics_providers]

    return(run)


# last variable is an artifact so it has same call signature as other callbacks
def add_to_database_if_nonzero( 
        product, 
        new_content, 
        method_name, 
        provider_name):

    print "in add_to_database_if_nonzero"

    if new_content and product:
        print "has new_content"
        updated_product = None
        if method_name=="aliases":
            updated_product = put_aliases_in_product(product, new_content)
        elif method_name=="biblio":
            updated_product = put_biblio_in_product(product, new_content, provider_name)
        elif method_name=="metrics":
            for metric_name in new_content:
                if new_content[metric_name]:
                    updated_product = put_snap_in_product(product, metric_name, new_content[metric_name])
        else:
            logger.warning(u"ack, supposed to save something i don't know about: " + str(new_content))

        if updated_product:
            db.session.merge(updated_product)
            commit(db)

    print "DONE add_to_database_if_nonzero"

    return


def provider_method_wrapper(product, provider, method_name):

    # logger.info(u"{:20}: in provider_method_wrapper with {tiid} {provider_name} {method_name} with {aliases}".format(
    #    "wrapper", tiid=product.tiid, provider_name=provider.provider_name, method_name=method_name, aliases=input_aliases_dict))


    input_alias_tuples = product.aliases_for_providers
    provider_name = provider.provider_name
    worker_name = provider_name+"_worker"
    method = getattr(provider, method_name)

    try:
        method_response = method(input_alias_tuples)
    except ProviderError, e:
        method_response = None

        logger.info(u"{:20}: **ProviderError {tiid} {method_name} {provider_name}, Exception type {exception_type} {exception_arguments}".format(
            worker_name, 
            tiid=product.tiid, 
            provider_name=provider_name.upper(), 
            method_name=method_name.upper(), 
            exception_type=type(e).__name__, 
            exception_arguments=e.args))

    ellipses = ""
    if method_response and len(method_response) >= 50:
        ellipses = "..."
    logger.info(u"{:20}: /biblio_print, RETURNED {tiid} {method_name} {provider_name} : {method_response:.50} {ellipses}".format(
        worker_name, tiid=product.tiid, method_name=method_name.upper(), 
        provider_name=provider_name.upper(), method_response=method_response, ellipses=ellipses))

    try:
        add_to_database_if_nonzero(product, method_response, method_name, provider_name)
    except sqlalchemy.exc.ProgrammingError:
        logger.error(u"error writing to database")
        pass

    return product.tiid


def provider_run(product, method_name, provider_name):

    provider = ProviderFactory.get_provider(provider_name)

    # logger.info(u"in provider_run for {provider}".format(
    #    provider=provider.provider_name))

    # (success, estimated_wait_seconds) = rate.acquire(provider_name, block=False)
    # if not success:
    #     logger.warning(u"RATE LIMIT HIT in provider_run for {provider} {method_name} {tiid}, retrying".format(
    #        provider=provider.provider_name, method_name=method_name, tiid=tiid))

    #     # add up to random 3 seconds to spread it out
    #     estimated_wait_seconds += random.random() * 3
    #     provider_run.retry(args=[tiid, method_name, provider_name],
    #             countdown=estimated_wait_seconds, 
    #             max_retries=10)

    response = provider_method_wrapper(product, provider, method_name)

    return product.tiid

def refresh_product(tiid):
    product = get_no_snaps_orphaned_product(tiid)

    pipeline = flat_sniffer(product.genre, product.host, product.aliases_for_providers)
    for (method_name, provider_name) in pipeline:
        # print "running ", tiid, method_name, provider_name
        # provider_run(product, method_name, provider_name)
        # print "done!"
        pass
    db.session.remove()

    return tiid


profile_queue = Queue("profile", connection=redis_rq_conn)
product_queue = Queue("product", connection=redis_rq_conn)

def enqueue_profile(profile):
    description = json.dumps(["profile", profile.url_slug])
    job_id = "profile:{url_slug}".format(url_slug=profile.url_slug)
    job = profile_queue.enqueue_call(func=refresh_profile, args=(profile.url_slug, ), 
            job_id=profile.url_slug,
            description=description)


def refresh_profile(url_slug):    
    print "getting full profile"
    profile = get_profile_stubs_from_url_slug(url_slug)

    job_ids = []
    for product in profile.display_products:
        print "enqueing product", product.tiid
        description = json.dumps(["product", product.tiid])
        job_id = "product:{tiid}".format(tiid=product.tiid)
        timeout = 60*5
        job = product_queue.enqueue_call(func=refresh_product, 
                args=(product.tiid, ), 
                job_id=product.tiid,
                description=description,
                timeout=timeout)
        job_ids.append(job.get_id())

    still_working = True
    while still_working:
        time.sleep(2)
        print ".",
        still_working = False
        for job_id in job_ids:
            job = Job.fetch(job_id, connection=redis_rq_conn)
            if not job.is_finished:
                still_working = True

    # would have to refresh profile here to do things with it
    # profile = Profile.query.filter(Profile.url_slug==url_slug).one()

    db.session.remove()

    return "Finished all of the profile!" + profile.url_slug

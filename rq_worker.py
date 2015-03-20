import os

import redis
from rq import Worker, Queue, Connection

from totalimpact import tiredis

# from totalimpactwebapp.profile import Profile
# from totalimpactwebapp.product import Product
from rq import Queue
from totalimpact import default_settings
from totalimpact.providers.provider import ProviderFactory, ProviderError, ProviderTimeout


queue_names = ["product", "profile", "default"]
redis_rq_conn = tiredis.from_url(os.getenv("REDIS_URL"), db=tiredis.REDIS_RQ_NUMBER)
workers = {}

if __name__ == '__main__':
    with Connection(redis_rq_conn):
        worker = Worker(map(Queue, queue_names))
        worker.work()


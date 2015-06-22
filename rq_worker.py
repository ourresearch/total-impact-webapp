import os
import redis
import optparse
from rq import Worker, Queue, Connection

from totalimpact import tiredis

# from totalimpactwebapp.profile import Profile
# from totalimpactwebapp.product import Product
from rq import Queue
from totalimpact import default_settings
from totalimpact.providers.provider import ProviderFactory, ProviderError, ProviderTimeout


redis_rq_conn = tiredis.from_url(os.getenv("REDIS_URL"), db=tiredis.REDIS_RQ_NUMBER)

if __name__ == '__main__':
    parser = optparse.OptionParser("usage: %prog [options]")
    parser.add_option('-q', '--queue', dest='queue', type="str",
                      help='profile or product')
    (options, args) = parser.parse_args()

    with Connection(redis_rq_conn):
        queue_name = options.queue
        queues = [queue_name, "default"]
        worker = Worker(map(Queue, queues))
        worker.work()


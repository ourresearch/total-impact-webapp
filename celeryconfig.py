import os
import sys
import urlparse
from kombu import Exchange, Queue

sys.path.append('.')

redis_url = os.environ.get('REDIS_URL', "redis://127.0.0.1:6379/")
if not redis_url.endswith("/"):
    redis_url += "/"

BROKER_URL = redis_url + "1"  # REDIS_CELERY_TASKS_DATABASE_NUMBER = 1
CELERY_RESULT_BACKEND = redis_url + "2"  # REDIS_CELERY_RESULTS_DATABASE_NUMBER = 2
REDIS_CONNECT_RETRY = True


# these options will be defaults in future as per http://celery.readthedocs.org/en/latest/getting-started/brokers/redis.html
BROKER_TRANSPORT_OPTIONS = {'fanout_prefix': True, 
                            'fanout_patterns': True, 
                            'visibility_timeout': 60,  # one minute
                            'max_connections': 100  # max redis connections for tasks. see https://github.com/celery/celery/issues/1350
                            }


BROKER_TRANSPORT_OPTIONS = {
    'priority_steps': [0, 3, 7, 9],
}

# added because https://github.com/celery/celery/issues/896
BROKER_POOL_LIMIT = None

CELERY_CREATE_MISSING_QUEUES = True

CELERY_ACCEPT_CONTENT = ['pickle', 'json']
CELERY_ENABLE_UTC=True
CELERY_TASK_RESULT_EXPIRES = 60*60  # 1 hour
CELERYD_MAX_TASKS_PER_CHILD = 1000
CELERYD_FORCE_EXECV = True
CELERY_TRACK_STARTED = True

# List of modules to import when celery starts.
CELERY_IMPORTS = ("tasks",)

CELERY_ANNOTATIONS = {
    'celery.chord_unlock': {'soft_time_limit': 60*60*8},  # 8 hours
}

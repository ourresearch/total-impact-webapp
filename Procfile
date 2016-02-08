web: gunicorn totalimpactwebapp:app -b 0.0.0.0:$PORT -w 3
celeryworker: ./celeryworkers.sh
core_celeryworker: ./core_celeryworkers.sh
RQ_worker_queue_0: python rq_worker.py 0

web: newrelic-admin run-program gunicorn totalimpactwebapp:app -b 0.0.0.0:$PORT -w 3
rq: python rq_worker.py
celeryworker: ./celeryworkers.sh
core_celeryworker: ./core_celeryworkers.sh


# set env variables for local running.
import config
config.set_env_vars_from_dot_env()

"""
this is just for troubleshooting New Relic...normally we dont' want
it sending data from localhost.
"""
# import newrelic.agent
# newrelic.agent.initialize()

from totalimpactwebapp import app
app.run(debug=True, threaded=True)



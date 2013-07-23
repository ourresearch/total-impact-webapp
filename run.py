import config
config.set_env_vars_from_dot_env()

from totalimpactwebapp import app
app.run(debug=True)
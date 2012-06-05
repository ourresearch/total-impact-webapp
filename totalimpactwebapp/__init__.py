from totalimpactwebapp import default_settings
import os, logging
from flask import Flask

# see http://docs.python.org/howto/logging-cookbook.html
logger = logging.getLogger("tiwebapp")
ch = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s %(levelname)8s %(name)s - %(message)s")
ch.setFormatter(formatter)
logger.addHandler(ch)

app = Flask(__name__)
app.config.from_object(default_settings)

from totalimpactwebapp import views

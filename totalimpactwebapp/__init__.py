import os, logging, sys
from flask import Flask

# see http://wiki.pylonshq.com/display/pylonscookbook/Alternative+logging+configuration
logging.basicConfig(
    stream=sys.stdout,
    level=logging.DEBUG,
    format='%(levelname)8s %(name)s - %(message)s'
)

logger = logging.getLogger("tiwebapp")


app = Flask(__name__)
app.config["ASSETS_DEBUG"] = os.getenv("ASSETS_DEBUG", "True") == "True"

# for testing; make sure yui compressor isn't going to explode when it processes this.
#app.config["ASSETS_DEBUG"] = False

from totalimpactwebapp import views

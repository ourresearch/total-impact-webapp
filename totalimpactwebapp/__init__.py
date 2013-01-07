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

from totalimpactwebapp import views

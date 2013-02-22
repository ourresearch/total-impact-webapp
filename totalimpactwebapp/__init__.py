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

# Setting ASSETS_DEBUG=True makes debugging easier by NOT minimizing the assets.
# Production should have ASSETS_DEBUG=False
# ASSETS_DEBUG=True is the default

app.config["ASSETS_DEBUG"] = (os.getenv("ASSETS_DEBUG", "True") == "True")

from totalimpactwebapp import views

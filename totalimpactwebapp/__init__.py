import os, logging, sys
from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import LoginManager

# set up logging
# see http://wiki.pylonshq.com/display/pylonscookbook/Alternative+logging+configuration
logging.basicConfig(
    stream=sys.stdout,
    level=logging.DEBUG,
    format='[%(process)d] %(levelname)8s %(threadName)30s %(name)s - %(message)s'
)
logger = logging.getLogger("tiwebapp")


# set up application
app = Flask(__name__)

# allow slashes and end of URLs even when they're not part of views:
# http://flask.pocoo.org/mailinglist/archive/2011/2/27/re-automatic-removal-of-trailing-slashes/#043b1a0b6e841ab8e7d38bd7374cbb58
app.url_map.strict_slashes = False

db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.setup_app(app)


# set up configs

# Set env PACK_ASSETS=True to pack/minimize assets.
# Set env PACK_ASSETS=False (default) to keep them in separate files.
# Production should be PACK_ASSETS=True
app.config["ASSETS_DEBUG"] = (os.getenv("PACK_ASSETS") != "True")

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")


# set up views
from totalimpactwebapp import views

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
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.setup_app(app)


# set up configs

# Setting ASSETS_DEBUG=True makes debugging easier by NOT minimizing the assets.
# Production should have ASSETS_DEBUG=False
# ASSETS_DEBUG=True is the default

app.config["ASSETS_DEBUG"] = (os.getenv("ASSETS_DEBUG", "True") == "True")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")


# set up views
from totalimpactwebapp import views

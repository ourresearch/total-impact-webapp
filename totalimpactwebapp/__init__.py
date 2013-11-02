import os, logging, sys
from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import LoginManager
from flask_debugtoolbar import DebugToolbarExtension
from sqlalchemy import exc
from sqlalchemy import event
from sqlalchemy.pool import Pool

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

# database stuff
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
db = SQLAlchemy(app)

# from http://docs.sqlalchemy.org/en/latest/core/pooling.html
# This recipe will ensure that a new Connection will succeed even if connections in the pool 
# have gone stale, provided that the database server is actually running. 
# The expense is that of an additional execution performed per checkout
@event.listens_for(Pool, "checkout")
def ping_connection(dbapi_connection, connection_record, connection_proxy):
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("SELECT 1")
    except:
        # optional - dispose the whole pool
        # instead of invalidating one at a time
        # connection_proxy._pool.dispose()

        # raise DisconnectionError - pool will try
        # connecting again up to three times before raising.
        raise exc.DisconnectionError()
    cursor.close()


# log in stuff
login_manager = LoginManager()
login_manager.setup_app(app)


# config and debugging stuff

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

# Set env PACK_ASSETS=True to pack/minimize assets.
# Set env PACK_ASSETS=False (default) to keep them in separate files.
# Production should be PACK_ASSETS=True
app.config["ASSETS_DEBUG"] = (os.getenv("PACK_ASSETS") != "True")


# set up Flask-DebugToolbar
if (os.getenv("FLASK_DEBUG", False) == "True"):
    logger.info("Setting app.debug=True; Flask-DebugToolbar will display")
    app.debug = True
    app.config["DEBUG_TB_INTERCEPT_REDIRECTS"] = False    
toolbar = DebugToolbarExtension(app)

try:
	from totalimpactwebapp import views
except exc.ProgrammingError:
	logger.info("SQLAlchemy database tables not found, so creating them")
	db.session.rollback()
	db.create_all()
	from totalimpactwebapp import views

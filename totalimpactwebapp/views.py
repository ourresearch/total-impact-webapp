import requests, os, json, logging, re, datetime
import mandrill
import analytics
from time import sleep

from flask import request, send_file, abort, make_response, g, redirect, url_for
from flask import render_template, flash
from flask.ext.login import login_user, logout_user, current_user, login_required

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from itsdangerous import TimestampSigner, SignatureExpired, BadTimeSignature


from totalimpactwebapp import app, db, login_manager
from totalimpactwebapp.password_reset import send_reset_token
from totalimpactwebapp.user import User, create_user_from_slug, get_user_from_id
from totalimpactwebapp.user import make_genre_heading_products
from totalimpactwebapp.utils.unicode_helpers import to_unicode_or_bust
from totalimpactwebapp.util import camel_to_snake_case

import newrelic.agent

logger = logging.getLogger("tiwebapp.views")
analytics.init(os.getenv("SEGMENTIO_PYTHON_KEY"), log_level=logging.INFO)



# i despise that we still have to have this :(
from flask.ext.assets import Environment, Bundle
assets = Environment(app)

js_widget = Bundle(
    'js/jquery-1.8.1.min.js',
    'js/json3.min.js',
    'js/icanhaz.js',
    'js/bootstrap-tooltip-and-popover.js',
    'js/underscore.js',
    'js/ti-item.js',
    # filters="yui_js", # comment this out if you want unminified version
    output="js/widget.js",
)
assets.register('js_widget', js_widget)












###############################################################################
#
#   CONVENIENCE FUNCTIONS
#
###############################################################################




def json_resp_from_jsonable_thing(jsonable_thing):
    json_str = json.dumps(jsonable_thing, sort_keys=True, indent=4)
    resp = make_response(json_str, 200)
    resp.mimetype = "application/json"
    return resp


def json_resp_from_thing(thing):
    """
    JSON-serialize an obj or dict and put it in a Flask response.
    This should be converted to an object and moved out of here...

    :param obj: the obj you want to serialize to json and send back
    :return: a flask json response, ready to send to client
    """

    try:
        return json_resp_from_jsonable_thing(thing)
    except TypeError:
        pass

    try:
        return json_resp_from_jsonable_thing(thing.as_dict())
    except AttributeError:
        pass

    temp_dict = thing.__dict__
    obj_dict = {}
    for k, v in temp_dict.iteritems():
        if k[0] != "_":  # we don't care to serialize private attributes

            if type(v) is datetime.datetime:  # convert datetimes to strings
                obj_dict[k] = v.isoformat()
            else:
                obj_dict[k] = v

    return json_resp_from_jsonable_thing(obj_dict)


def abort_json(status_code, msg):
    body_dict = {
        "HTTP_status_code": status_code,
        "message": msg,
        "error": True
    }

    resp_string = json.dumps(body_dict, sort_keys=True, indent=4)
    resp = make_response(resp_string, status_code)
    resp.mimetype = "application/json"

    abort(resp)




def render_template_custom(template_name, **kwargs):
    kwargs["newrelic_footer"] = newrelic.agent.get_browser_timing_footer()
    if os.getenv("STATUS_SLOW", False) in [True, "true", "True", 1]:
        flash(
            "<strong>Performance notice:</strong> our server is currently backed up. We're fixing it now; see our <a href='http://twitter.com/impactstory_now'>status feed</a> for updates.",
            "error"
        )

    return render_template(template_name, **kwargs)


def get_user_for_response(id, request, include_products=True):
    id_type = request.args.get("id_type", "userid")

    retrieved_user = get_user_from_id(id, id_type, include_products)
    if retrieved_user is None:
        logger.debug(u"in get_user_for_response, user {id} doesn't exist".format(
            id=id))
        abort(404, "That user doesn't exist.")

    return retrieved_user















###############################################################################
#
#   BEFORE AND AFTER REQUESTS
#
###############################################################################



@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.before_first_request
def setup_db_tables():
    logger.info(u"first request; setting up db tables.")
    db.create_all()




@app.before_request
def load_globals():
    g.user = current_user

    g.api_root = os.getenv("API_ROOT")
    g.segmentio_key = os.getenv("SEGMENTIO_KEY")
    g.mixpanel_token = os.getenv("MIXPANEL_TOKEN")

    g.api_key = os.getenv("API_KEY")
    g.newrelic_header = newrelic.agent.get_browser_timing_header()



@app.before_request
def log_ip_address():
    if request.endpoint != "static":
        try:
            logger.info(u"{ip_address} IP address calling {method} {url}".format(
                ip_address=request.remote_addr, 
                method=request.method, 
                url=to_unicode_or_bust(request.url)))
        except UnicodeDecodeError:
            logger.debug(u"UnicodeDecodeError logging request url. Caught exception but needs fixing")


@app.before_request
def redirect_everything_but_root_and_static_and_api():
    reasons_not_to_redirect = [
        (request.path[0:4] == "/api"),
        (request.path == "/"),
        (request.path[0:7] == "/static")
    ]
    path = request.path

@app.after_request
def add_crossdomain_header(resp):
    #support CORS
    resp.headers['Access-Control-Allow-Origin'] = "*"
    resp.headers['Access-Control-Allow-Methods'] = "POST, GET, OPTIONS, PUT, DELETE, PATCH"
    resp.headers['Access-Control-Allow-Headers'] = "origin, content-type, accept, x-requested-with"
    return resp


@app.template_filter('extract_filename')
def extract_filename(s):
    res = re.findall('\'([^\']*)\'', str(s))
    if res:
        return res[0].split(".")[0]
    return None











@app.route("/headers", methods=["GET", "POST"])
def test_headers():
    headers = {}
    for k, v in request.headers.iteritems():
        headers[k] = v

    del headers["Cookie"]  # takes up too much space

    return json_resp_from_thing(headers)












###############################################################################
#
#   JSON VIEWS (API)
#
###############################################################################



#------------------ /user/:actions -----------------


@app.route("/user/current")
def get_current_user():
    sleep(1)

    try:
        return json_resp_from_thing({"user": g.user.as_dict()})

    except AttributeError:  # anon user has no as_dict()
        return json_resp_from_thing({"user": None})


@app.route('/user/logout', methods=["POST", "GET"])
def logout():
    sleep(1)
    logout_user()
    return json_resp_from_thing({"msg": "user logged out"})


@app.route("/user/login", methods=["POST"])
def login():

    logger.debug(u"user trying to log in.")
    sleep(1)

    email = unicode(request.json["email"]).lower()
    password = unicode(request.json["password"])

    user = User.query.filter_by(email=email).first()

    if user is None:
        abort(404, "Email doesn't exist")
    elif not user.check_password(password):
        abort(401, "Wrong password")
    else:
        # Yay, no errors! Log the user in.
        login_user(user)

    user = User.query.filter_by(email=email).first()
    login_user(user)

    return json_resp_from_thing({"user": user.as_dict()})


@app.route("/user/login/token", methods=["POST"])
def login_from_token():
    logger.debug(u"user trying to log in from token.")
    sleep(1)

    reset_token = unicode(request.json["token"])
    s = TimestampSigner(os.getenv("SECRET_KEY"), salt="reset-password")
    error = ""
    try:
        email = s.unsign(reset_token, max_age=60*60*24).lower()  # 24 hours

    except (SignatureExpired, BadTimeSignature):
        abort_json(401, "This token ain't no good.")

    # the token is one we made. Whoever has it pwns this account
    user = User.query.filter_by(email=email).first()
    if user is None:
        abort(404, "Sorry, that user doesn't exist.")

    login_user(user)
    return json_resp_from_thing({"user": user.as_dict()})




#------------------ /user/:id   -----------------


@app.route("/user/<profile_id>", methods=['GET', 'POST'])
def user_profile(profile_id):
    if request.method == "GET":
        user = get_user_for_response(
            profile_id,
            request,
            include_products=False  # returns faster this way.
        )
        return json_resp_from_thing(user)

    elif request.method == "POST":
        if request.args.get("id_type") != "url_slug":
            abort_json(400, "You can only create new users from a url slug for now.")

        userdict = {camel_to_snake_case(k): v for k, v in request.json.iteritems()}
        try:
            user = create_user_from_slug(profile_id, userdict, g.api_root, db)

            # user = User.query.filter_by(email="52@e.com").first()

        except IntegrityError:
            abort_json(409, "Your user_slug isn't unique.")

        logger.debug(u"logging in user {user}".format(
            user=user.as_dict()))
        login_user(user)
        return json_resp_from_thing({"user": user.as_dict()})

    user = User.query.filter_by(email="52@e.com").first()
    login_user(user)

    return json_resp_from_thing({"user": user.as_dict()})




#------------------ /user/:id/about   -----------------


@app.route("/user/<profile_id>/about", methods=['GET', 'PATCH'])
def get_user_about(profile_id):

    logger.debug(u"got request for user {profile_id}".format(
        profile_id=profile_id))

    user = get_user_for_response(
        profile_id,
        request,
        include_products=False  # returns faster this way.
    )
    logger.debug(u"got the user out: {user}".format(
        user=user.as_dict()))

    if request.method == "GET":
        pass

    elif request.method == "PATCH":
        logger.debug(u"got patch request for user {profile_id} {json}".format(
            profile_id=profile_id, json=request.json))

        user.patch(request.json["about"])
        logger.debug(u"patched the user: {user} ".format(
            user=user.as_dict()))

        db.session.commit()


    return json_resp_from_thing({"about": user.as_dict()})






#------------------ user/:userId/products -----------------

@app.route("/user/<id>/products", methods=["GET"])
def user_products_get(id):


    user = get_user_for_response(id, request)

    resp = user.products
    if request.args.get("include_heading_products") in [1, "true", "True"]:
        resp += make_genre_heading_products(resp)

    return  json_resp_from_thing(resp)



@app.route("/user/<id>/products", methods=["GET", "POST", "DELETE", "PATCH"])
def user_products_modify(id):

    user = get_user_for_response(id, request)
    logger.debug(u"got user {user}".format(
        user=user))

    # Make sure the user is allowed to make these modifications:
    if current_user is None:
        abort_json(405, "You must be logged in to modify profiles.")
    elif current_user.url_slug != user.url_slug:
        abort_json(401, "Only profile owners can modify profiles.")

    if request.method == "POST":
        # you can't add/create stuff here, just refresh extant products.
        resp = user.refresh_products()

    elif request.method == "PATCH":
        tiids_to_add = request.json.get("tiids")
        resp = {"products": user.add_products(tiids_to_add)}

    elif request.method == "DELETE":
        tiids_to_delete = request.json.get("tiids")
        resp = user.delete_products(tiids_to_delete)

    else:
        abort(405)  # method not supported.  We shouldn't get here.

    response_to_send = json_resp_from_thing(resp)
    return response_to_send


@app.route("/user/<user_id>/product/<tiid>", methods=['GET'])
def user_product(user_id, tiid):

    user = get_user_for_response(user_id, request)
    try:
        requested_product = [product for product in user.products if product["_id"] == tiid][0]
    except IndexError:
        abort_json(404, "That product doesn't exist.")

    return json_resp_from_thing(requested_product)



@app.route("/user/<id>/products.csv", methods=["GET"])
def user_products_csv(id):

    user = get_user_for_response(id, request)
    tiids = user.tiids

    url = "{api_root}/v1/products.csv/{tiids_string}?key={api_key}".format(
        api_key=g.api_key,
        api_root=g.api_root,
        tiids_string=",".join(tiids))
    r = requests.get(url)
    csv_contents = r.text

    resp = make_response(unicode(csv_contents), r.status_code)
    resp.mimetype = "text/csv;charset=UTF-8"
    resp.headers.add("Content-Disposition",
                     "attachment; filename=impactstory.csv")
    resp.headers.add("Content-Encoding", "UTF-8")

    return resp



#------------------ user/:id/password -----------------

@app.route("/user/<id>/password", methods=["POST"])
def user_password_modify(id):
    retrieved_user = get_user_for_response(id, request)
    current_password = request.json.get("currentPassword", None)

    if retrieved_user.check_password(current_password):
        retrieved_user.set_password(request.json["newPassword"])
        login_user(retrieved_user)
        db.session.commit()
        return json_resp_from_thing({"response": "ok"})

    else:
        abort(403, "The current password is not correct.")




@app.route("/user/<id>/password", methods=["GET"])
def get_password_reset_link(id):
    if request.args.get("id_type") != "email":
        abort_json(400, "id_type param must be 'email' for this endpoint.")

    retrieved_user = get_user_for_response(id, request)

    ret = send_reset_token(retrieved_user.email, request.url_root)
    return json_resp_from_thing({"sent_reset_email": ret})




#------------------ importers/:importer -----------------

@app.route("/importer/<importer_name>", methods=["POST"])
def import_products(importer_name):

    query = "{core_api_root}/v1/importer/{importer_name}?api_admin_key={api_admin_key}".format(
        core_api_root=g.api_root,
        importer_name=importer_name,
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )
    r = requests.post(
        query,
        # data=json.dumps({"input", request.json["input"]}),
        data=request.data,
        headers={'Content-type': 'application/json', 'Accept': 'application/json'}
    )

    return json_resp_from_thing(r.json())







#------------------ users/test  (manage test users) -----------------


@app.route("/users/test", methods=["DELETE", "GET"])
def delete_test_user():
    coll_delete_params = {
        "include_items": "true",
        "api_admin_key": os.getenv("API_ADMIN_KEY")
    }
    if request.method == "DELETE" or request.args.get("method") == "delete":

        # for now just the first one...should be all of them
        retrieved_users = User.query.filter(User.surname == "impactstory").all()
        for user in retrieved_users:
            if user.collection_id is None:
                continue

            url = g.api_root + "/v1/collection/" + user.collection_id
            r = requests.delete(url, params=coll_delete_params)
            logger.debug(u"delete colls and items; {text}".format(
                text=r.text))

            logger.debug(u"deleting user {email}".format(
                email=user.email))

            db.session.delete(user)

        db.session.commit()
        return make_response("deleted {num_users} users.".format(
            num_users=len(retrieved_users)))
    else:
        return make_response("these endpoint only supports deleting for now.")


@app.route("/users/test/collection_ids")
def test_user_cids():
    test_users = User.query.filter(User.surname == "impactstory").all()
    logger.debug(u"test users: {test_users}".format(
        test_users=test_users))

    test_collection_ids = [user.collection_id for user in test_users]
    return json_resp_from_thing({"collection_ids": test_collection_ids})




#------------------ /providers  (information about providers) -----------------
@app.route('/providers', methods=["GET"])
def providers():
    try:
        url = "{api_root}/v1/provider?key={api_key}".format(
            api_key=g.api_key,
            api_root=g.api_root)
        r = requests.get(url)
        metadata = r.json()
    except requests.ConnectionError:
        metadata = {}

    metadata_list = []
    for k, v in metadata.iteritems():
        v.name = k
        metadata_list.append(v)

    return json_resp_from_thing(metadata_list)

















###############################################################################
#
#   MOSTLY-STATIC PAGES
#
###############################################################################




@app.route("/<path:dummy>")  # from http://stackoverflow.com/a/14023930/226013
def redirect_to_profile(dummy):
    """
    Route things that look like user profile urls.

    *Everything* not explicitly routed to another function will end up here.
    """
    return render_template_custom('index.html')



# static pages
@app.route('/')
def index():
    return render_template_custom('index.html')



# @app.route('/api-docs')
# def apidocs():
#     return render_template_custom('api-docs.html')


@app.route("/loading.gif")
def images():
    path = "static/img/loading-small.gif"
    return send_file(path)





















###############################################################################
#
#   WIDGET STUFF
#
###############################################################################


@app.route("/embed/test/widget")
def embed_test_widget():
    return render_template_custom("test-pages/sample-embed-internal-test.html")


@app.route("/embed/impactstory.js")
@app.route("/embed/v1/impactstory.js")
def impactstory_dot_js():

    # not using render_template_custom() here, since this is a js page and is Special.
    badges_template = render_template("js-template-badges.html").replace("\n", "").replace("'", "&apos;")

    # First build the concatenated js file for the widget. Building makes a file.
    # Then open the file and put it in the template to return.
    js_widget.build() # always build this, whether dev in dev env or not
    libs = open(os.path.dirname(__file__) + "/static/js/widget.js", "r").read()

    # not using render_template_custom() here, since this is a js page and is Special.
    rendered = render_template(
        "embed/impactstory.js",
        badges_template=badges_template,
        libs=unicode(libs, "utf-8")
    )
    resp = make_response(rendered)
    """
    There is no standard way to indicate you're sending back javascript;
    This seems the most recommended one, though. See
    http://stackoverflow.com/questions/2706290/why-write-script-type-text-javascript-when-the-mime-type-is-set-by-the-serve
    and http://www.ietf.org/rfc/rfc4329.txt
     """
    resp.headers["Content-Type"] = "application/javascript; charset=utf-8"
    return resp


@app.route("/widget-analytics", methods=['GET'])
def widget_analytics():
    d = {}
    for k, v in request.args.iteritems():
        d[k] = v

    try:
        d["hostname"] = d['url'].split("/")[2]
        d["domain"] = ".".join(d['hostname'].split(".")[-2:])  # like "impactstory.org"
    except KeyError:
        #nevermind then
        pass

    try:
        api_key = d["api-key"]
    except KeyError:
        api_key = "unknown"

    logger.info(u"got widget analytics data: {data}".format(
        data=d))

    try:
        # later look stuff up here from db, based on api-key; send along w identify() call...
        analytics.identify(user_id=api_key)
    except IndexError:
        logger.debug(u"IndexError when doing analytics.identify in widget_analytics")

    try:
        analytics.track(
            user_id=api_key,
            event="Served a page with embedded widget",
            properties=d
        )
    except IndexError:
        logger.debug(u"IndexError when doing analytics.track in widget_analytics")

    try:
        analytics.flush(async=False)  # make sure all the data gets sent to segment.io
    except IndexError:
        # sometimes the data was already flushed and we get an error popping from an empty queue
        logger.debug(u"IndexError when doing analytics.flush in widget_analytics")

    return make_response(request.args.get("callback", "") + '({"status": "success"})', 200)



@app.route('/admin/key')
def generate_api_key():
    return render_template_custom('generate-api.html')

@app.route('/logo')
def logo():
    filename = "static/img/logos/impactstory-logo-big.png"
    return send_file(filename, mimetype='image/png')



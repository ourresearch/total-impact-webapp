import requests, os, json, logging, re, datetime
import mandrill
import analytics
from time import sleep

from flask import request, send_file, abort, make_response, g, redirect, url_for
from flask import render_template
from flask.ext.login import login_user, logout_user, current_user, login_required

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from itsdangerous import TimestampSigner


from totalimpactwebapp import app, db, login_manager

from totalimpactwebapp.password_reset import send_reset_token
from totalimpactwebapp.password_reset import reset_password_from_token
from totalimpactwebapp.password_reset import reset_password
from totalimpactwebapp.password_reset import PasswordResetError

from totalimpactwebapp.user import User, create_user_from_slug, get_user_from_id
from totalimpactwebapp.user import remove_duplicates_from_user
from totalimpactwebapp.products import add_category_heading_products
from totalimpactwebapp.products import add_sort_keys
from totalimpactwebapp.utils.unicode_helpers import to_unicode_or_bust
from totalimpactwebapp.util import camel_to_snake_case
from totalimpactwebapp import views_helpers

import newrelic.agent

logger = logging.getLogger("tiwebapp.views")
analytics.init(os.getenv("SEGMENTIO_PYTHON_KEY"), log_level=logging.INFO)












###############################################################################
#
#   CONVENIENCE FUNCTIONS
#
###############################################################################




def json_resp_from_jsonable_thing(jsonable_thing):
    json_str = json.dumps(jsonable_thing, sort_keys=True, indent=4)
    resp = make_response(json_str, 200)
    resp.mimetype = "application/json"
    return views_helpers.bust_caches(resp)


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


def get_user_for_response(id, request, include_products=True):
    id_type = unicode(request.args.get("id_type", "url_slug"))

    try:
        logged_in = unicode(getattr(current_user, id_type)) == id
    except AttributeError:
        logged_in = False

    retrieved_user = get_user_from_id(id, id_type, logged_in, include_products)

    if retrieved_user is None:
        logger.debug(u"in get_user_for_response, user {id} doesn't exist".format(
            id=id))
        abort(404, "That user doesn't exist.")

    return retrieved_user





def make_js_response(template_name, **kwargs):
    rendered = render_template(template_name, **kwargs)
    resp = make_response(rendered)
    resp.headers["Content-Type"] = "application/javascript; charset=utf-8"
    return resp








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
    g.api_key = os.getenv("API_KEY")



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












###############################################################################
#
#   JSON VIEWS (API)
#
###############################################################################


#------------------ /user/:actions -----------------




@app.route("/user/current")
def get_current_user():
    #sleep(1)

    try:
        ret = {"user": g.user.as_dict()}

    except AttributeError:  # anon user has no as_dict()
        ret = {"user": None}

    return json_resp_from_thing(ret)



@app.route('/user/logout', methods=["POST", "GET"])
def logout():
    #sleep(1)
    logout_user()
    return json_resp_from_thing({"msg": "user logged out"})



@app.route("/user/login", methods=["POST"])
def login():

    logger.debug(u"user trying to log in.")
    #sleep(1)

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

        except IntegrityError:
            abort_json(409, "Your user_slug isn't unique.")

        logger.debug(u"logging in user {user}".format(
            user=user.as_dict()))

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




@app.route("/user/<profile_id>/tips", methods=['GET', 'DELETE'])
def user_tips(profile_id):
    user = get_user_for_response(
        profile_id,
        request,
        include_products=False  # returns faster this way.
    )

    if request.method == "GET":
        resp = user.get_tips()

    elif request.method == "DELETE":
        resp = user.delete_tip(request.json.get("id"))

    db.session.commit()

    return json_resp_from_thing({'ids': resp})





#------------------ user/:userId/products -----------------

@app.route("/user/<id>/products", methods=["GET"])
def user_products_get(id):

    user = get_user_for_response(id, request)

    if request.args.get("group_by")=="duplicates":
        user = get_user_for_response(id, request)
        resp = user.get_duplicates_list()
    else:        
        products = add_sort_keys(user.products)
        if request.args.get("include_heading_products") in [1, "true", "True"]:
            resp = add_category_heading_products(products)
        else:
            resp = products

    return json_resp_from_thing(resp)


@app.route("/user/<id>/products", methods=["POST", "DELETE", "PATCH"])
def user_products_modify(id):

    sleep(2)

    action = request.args.get("action", "refresh")
    user = get_user_for_response(id, request)
    logger.debug(u"got user {user}".format(
        user=user))

    if request.method == "POST" and (action == "refresh"):
        # anyone can refresh extant products.
        source = request.args.get("source", "webapp")
        tiids_being_refreshed = user.refresh_products(source)
        resp = {"products": tiids_being_refreshed}

    else:
        # Actions that require authentication

        if current_user is None:
            abort_json(405, "You must be logged in to modify profiles.")
        elif current_user.url_slug != user.url_slug:
            abort_json(401, "Only profile owners can modify profiles.")

        # actions, depending on what http method was used:
        if request.method == "POST" and action == "deduplicate":
            deleted_tiids = remove_duplicates_from_user(user.id)
            resp = {"deleted_tiids": deleted_tiids}

        elif request.method == "PATCH":
            tiids_to_add = request.json.get("tiids")
            resp = {"products": user.add_products(tiids_to_add)}

        elif request.method == "DELETE":
            tiids_to_delete = request.json.get("tiids")
            resp = user.delete_products(tiids_to_delete)

        else:
            abort(405)  # method not supported.  We shouldn't get here.

    return json_resp_from_thing(resp)


@app.route("/user/<user_id>/product/<tiid>", methods=['GET'])
def user_product(user_id, tiid):

    # the fake "embed" user supports requests from the old badges widget.
    embed_product = views_helpers.get_product_for_embed_user(
        user_id,
        tiid,
        g.api_root,
        os.getenv("API_ADMIN_KEY")
    )
    if embed_product is not None:
        return json_resp_from_thing(embed_product)

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

    url = u"{api_root}/v1/products.csv/{tiids_string}?key={api_key}".format(
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

    current_password = request.json.get("currentPassword", None)
    new_password = request.json.get("newPassword", None)
    id_type = request.args.get("id_type")

    try:
        if id_type == "reset_token":
            user = reset_password_from_token(id, request.json["newPassword"])
        else:
            user = reset_password(id, id_type, current_password, new_password)

    except PasswordResetError as e:
        abort_json(403, e.message)

    db.session.commit()
    return json_resp_from_thing({"about": user.as_dict()})



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

    query = u"{core_api_root}/v1/importer/{importer_name}?api_admin_key={api_admin_key}".format(
        core_api_root=g.api_root,
        importer_name=importer_name,
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )
    analytics_credentials = current_user.get_analytics_credentials()
    data_dict = json.loads(request.data)
    data_dict["analytics_credentials"] = analytics_credentials
    r = requests.post(
        query,
        data=json.dumps(data_dict),
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
        return make_response(u"deleted {num_users} users.".format(
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
        url = u"{api_root}/v1/provider?key={api_key}".format(
            api_key=g.api_key,
            api_root=g.api_root)
        r = requests.get(url)
        metadata = r.json()
    except requests.ConnectionError:
        metadata = {}

    metadata_list = []
    for k, v in metadata.iteritems():
        v["name"] = k
        metadata_list.append(v)

    return json_resp_from_thing(metadata_list)

















###############################################################################
#
#   MOSTLY-STATIC PAGES
#
###############################################################################




@app.route("/<path:dummy>")  # from http://stackoverflow.com/a/14023930/226013
@app.route("/")
def redirect_to_profile(dummy="index"):
    """
    EVERYTHING not explicitly routed to another view function will end up here.
    """

    # first, serve pre-rendered pages to search engines:
    useragent = request.headers.get("User-Agent", "").lower()
    crawer_useragent_fragments = ["googlebot", "bingbot"]

    for useragent_fragment in crawer_useragent_fragments:
        if useragent_fragment in useragent:
            page = dummy.replace("/", "_")
            file_template = u"static/rendered-pages/{page}.html"
            try:
                return send_file(file_template.format(page=page))
            except (IOError, UnicodeEncodeError):
                # eventually, render the page on the fly
                # for now, just return what the user sees
                return render_template('index.html')  

    # not a search engine?  return the page.
    return render_template('index.html')


@app.route("/google6653442d2224e762.html")
def google_verification():
    # needed for https://support.google.com/webmasters/answer/35179?hl=en
    return send_file("static/rendered-pages/google6653442d2224e762.html")

@app.route("/robots.txt")
def google_verification():
    # needed for https://support.google.com/webmasters/answer/35179?hl=en
    return send_file("static/rendered-pages/robots.txt")


@app.route("/loading.gif")
def images():
    path = "static/img/spinner.gif"
    return send_file(path)


@app.route('/item/<namespace>/<path:nid>', methods=['GET'])
def item_page(namespace, nid):
    url = u"{api_root}/v1/tiid/{namespace}/{nid}?api_admin_key={api_admin_key}".format(
        api_root=g.api_root,
        namespace=namespace,
        nid=nid,
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )
    print "making request with this url: ", url
    r = requests.get(url)
    try:
        tiid = r.json()["tiid"]
    except KeyError:
        abort(404, "Sorry, we've got no record for that item.")
    return redirect("/embed/product/" + tiid, 301)


@app.route("/top.js")
def get_js_top():
    newrelic_header = views_helpers.remove_script_tags(
        newrelic.agent.get_browser_timing_header()
    )
    return make_js_response(
        "top.js",
        segmentio_key=os.getenv("SEGMENTIO_KEY"),
        mixpanel_token=os.getenv("MIXPANEL_TOKEN"),
        newrelic_header=newrelic_header
    )


@app.route("/bottom.js")
def get_js_bottom():
    newrelic_footer = views_helpers.remove_script_tags(
        newrelic.agent.get_browser_timing_footer()
    )
    return make_js_response(
        "bottom.js",
        newrelic_footer=newrelic_footer
    )












###############################################################################
#
#   WIDGET STUFF
#
###############################################################################



@app.route("/embed/impactstory.js")
@app.route("/embed/v1/impactstory.js")
def impactstory_dot_js():
    """
    To use this in production, make sure the root vars at the top of widget.js
    are pointing to the correct server. This must be done manually before
    deploying, if you've been testing locally.

    """
    return send_file("static/js/widget.js", mimetype="application/javascript")




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



@app.route('/logo')
def logo():
    filename = "static/img/logos/impactstory-logo-big.png"
    return send_file(filename, mimetype='image/png')



import requests, os, json, logging, re, datetime
import analytics
from util import local_sleep

from flask import request, send_file, abort, make_response, g, redirect
from flask import render_template
from flask import render_template_string
from flask.ext.login import login_user, logout_user, current_user, login_required

from sqlalchemy.exc import IntegrityError


from totalimpactwebapp import app, db, login_manager, products_list, product

from totalimpactwebapp.password_reset import send_reset_token
from totalimpactwebapp.password_reset import reset_password_from_token
from totalimpactwebapp.password_reset import reset_password
from totalimpactwebapp.password_reset import PasswordResetError

from totalimpactwebapp.user import User, create_user_from_slug, get_user_from_id, delete_user
from totalimpactwebapp.user import remove_duplicates_from_user
from totalimpactwebapp.user import EmailExistsError
from totalimpactwebapp.utils.unicode_helpers import to_unicode_or_bust
from totalimpactwebapp.util import camel_to_snake_case
from totalimpactwebapp import views_helpers
from totalimpactwebapp import profile_award

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


def get_user_for_response(id, request):
    id_type = unicode(request.args.get("id_type", "url_slug"))

    try:
        logged_in = unicode(getattr(current_user, id_type)) == id
    except AttributeError:
        logged_in = False

    retrieved_user = get_user_from_id(id, id_type, logged_in)

    if retrieved_user is None:
        logger.debug(u"in get_user_for_response, user {id} doesn't exist".format(
            id=id))
        abort(404, "That user doesn't exist.")

    g.profile_slug = retrieved_user.url_slug

    return retrieved_user


def make_js_response(template_name, **kwargs):
    rendered = render_template(template_name, **kwargs)
    resp = make_response(rendered)
    resp.headers["Content-Type"] = "application/javascript; charset=utf-8"
    return resp


def has_admin_authorization():
    return request.args.get("key", "") == os.getenv("API_ADMIN_KEY")




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
    g.webapp_root = os.getenv("WEBAPP_ROOT_PRETTY", os.getenv("WEBAPP_ROOT"))


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

#@app.after_request
#def local_sleep_a_bit_for_everything(resp):
#    local_sleep(.8)
#    return resp








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
        ret = {"user": g.user.dict_about()}

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

    return json_resp_from_thing({"user": user.dict_about()})




#------------------ /user/:id   -----------------


@app.route("/user/<profile_id>", methods=['GET'])
def user_profile(profile_id):
    user = get_user_for_response(
        profile_id,
        request
    )
    return json_resp_from_thing(user)


@app.route("/user/<slug>", methods=["POST"])
def create_new_user_profile(slug):
    userdict = {camel_to_snake_case(k): v for k, v in request.json.iteritems()}

    try:
        user = create_user_from_slug(slug, userdict, db)

    except EmailExistsError:
        abort_json(409, "That email already exists.")

    user_profile_url = u"{webapp_root}/{url_slug}".format(
        webapp_root=g.webapp_root, url_slug=user.url_slug)
    logger.debug(u"created new user {user_profile_url}".format(
        user_profile_url=user_profile_url)

    # send to alert
    for webhook_slug in os.getenv("ZAPIER_ALERT_HOOKS", "").split(","):
        zapier_webhook_url = "https://zapier.com/hooks/catch/n/{webhook_slug}/".format(
            webhook_slug=webhook_slug)
        r = requests.post(zapier_webhook_url,
            data=json.dumps({
                "user_profile_url": user_profile_url
                }),
            headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    logger.debug(u"new user {url_slug} has id {id}".format(
        url_slug=user.url_slug, id=user.id))

    login_user(user)

    return json_resp_from_thing({"user": user.dict_about()})



@app.route("/user/<profile_id>", methods=["DELETE"])
def user_delete(profile_id):
    if not has_admin_authorization():
        abort_json(401, "Need admin key to delete users")

    user = get_user_for_response(profile_id, request)
    delete_user(user)
    return json_resp_from_thing({"user": "deleted"})



#------------------ /user/:id/about   -----------------


@app.route("/user/<profile_id>/about", methods=['GET', 'PATCH'])
def user_about(profile_id):

    logger.debug(u"got request for user {profile_id}".format(
        profile_id=profile_id))

    user = get_user_for_response(
        profile_id,
        request
    )
    logger.debug(u"got the user out: {user}".format(
        user=user.dict_about()))

    if request.method == "GET":
        pass

    elif request.method == "PATCH":
        logger.debug(
            u"got patch request for user {profile_id} (PK {pk}): '{log}'. {json}".format(
            profile_id=profile_id,
            pk=user.id,
            log=request.args.get("log", "").replace("+", " "),
            json=request.json)
        )

        user.patch(request.json["about"])
        logger.debug(u"patched the user: {user} ".format(
            user=user.dict_about()))

        db.session.commit()

    return json_resp_from_thing({"about": user.dict_about()})




@app.route("/user/<profile_id>/awards", methods=['GET'])
def user_profile_awards(profile_id):
    user = get_user_for_response(
        profile_id,
        request
    )

    return json_resp_from_thing(user.profile_awards_dicts)






#------------------ user/:userId/products -----------------

@app.route("/user/<id>/products", methods=["GET"])
def user_products_get(id):

    user = get_user_for_response(id, request)

    try:
        if current_user.url_slug == user.url_slug:
            user.update_last_viewed_profile()
    except AttributeError:   #AnonymousUser
        pass

    if request.args.get("group_by")=="duplicates":
        resp = products_list.get_duplicates_list_from_tiids(user.tiids)
    else:        
        include_headings = request.args.get("include_heading_products") in [1, "true", "True"]
        resp = products_list.prep(
            user.products,
            include_headings
        )

    return json_resp_from_thing(resp)


@app.route("/product/<tiid>/biblio", methods=["PATCH"])
def product_biblio_modify(tiid):

    #try:
    #    if current_user.url_slug != user.url_slug:
    #        abort_json(401, "Only profile owners can modify profiles.")
    #except AttributeError:
    #    abort_json(405, "You must be logged in to modify profiles.")

    query = u"{core_api_root}/v1/product/{tiid}/biblio?api_admin_key={api_admin_key}".format(
        core_api_root=g.api_root,
        tiid=tiid,
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )
    data_dict = json.loads(request.data)
    r = requests.patch(
        query,
        data=json.dumps(data_dict),
        headers={'Content-type': 'application/json', 'Accept': 'application/json'}
    )

    local_sleep(1)
    
    return json_resp_from_thing(r.json())


@app.route("/user/<id>/products", methods=["POST", "DELETE", "PATCH"])
def user_products_modify(id):

    action = request.args.get("action", "refresh")
    user = get_user_for_response(id, request)
    logger.debug(u"got user {user}".format(
        user=user))

    if request.method == "POST" and action == "deduplicate":
        deleted_tiids = remove_duplicates_from_user(user.id)
        resp = {"deleted_tiids": deleted_tiids}

    elif request.method == "POST" and (action == "refresh"):
        source = request.args.get("source", "webapp")
        tiids_being_refreshed = user.refresh_products(source)
        resp = {"products": tiids_being_refreshed}

    else:

        # Actions that require authentication
        try:
            if current_user.url_slug != user.url_slug:
                abort_json(401, "Only profile owners can modify profiles.")
        except AttributeError:
            abort_json(405, "You must be logged in to modify profiles.")

        if request.method == "PATCH":
            resp = {"products": user.add_products(request.json)}

        elif request.method == "DELETE":
            tiids_to_delete = request.json.get("tiids")
            resp = user.delete_products(tiids_to_delete)

        else:
            abort(405)  # method not supported.  We shouldn't get here.

    return json_resp_from_thing(resp)


@app.route("/user/<user_id>/product/<tiid>", methods=['GET'])
def user_product(user_id, tiid):

    if user_id == "embed":
        abort(410)

    user = get_user_for_response(user_id, request)
    try:
        requested_product = [p for p in user.products if p["_id"] == tiid][0]
    except IndexError:
        abort_json(404, "That product doesn't exist.")

    prepped = product.prep_product(requested_product, True)

    return json_resp_from_thing(prepped)



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
    return json_resp_from_thing({"about": user.dict_about()})



@app.route("/user/<id>/password", methods=["GET"])
def get_password_reset_link(id):
    if request.args.get("id_type") != "email":
        abort_json(400, "id_type param must be 'email' for this endpoint.")

    retrieved_user = get_user_for_response(id, request)

    ret = send_reset_token(retrieved_user.email, request.url_root)
    return json_resp_from_thing({"sent_reset_email": ret})



#------------------ importers/:importer -----------------



@app.route("/user/<id>/linked-accounts/<account>", methods=["POST"])
def user_linked_accounts_update(id, account):
    user = get_user_for_response(id, request)
    tiids = user.update_products_from_linked_account(account)
    return json_resp_from_thing({"products": tiids})



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







#------------------ /tests  (supports functional testing) -----------------


@app.route("/tests", methods=["DELETE"])
def delete_all_test_users():
    if not has_admin_authorization():
        abort_json(401, "Need admin key to delete all test users")

    email_suffex_for_text_accounts = "@test-impactstory.org"
    users = User.query.filter(User.email.like("%"+email_suffex_for_text_accounts)).all()
    user_slugs_deleted = []
    for user in users:
        user_slugs_deleted.append(user.url_slug)
        delete_user(user)
    return json_resp_from_thing({"test_users": user_slugs_deleted})




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


def render_standalone(filename, **kwargs):
    current_dir = os.path.dirname(os.path.realpath(__file__))
    path = current_dir + "/standalone/" + filename

    with open(path, "r") as f:
        template_str = f.read()

    return render_template_string(template_str, **kwargs)


@app.route("/2013")
def get_2013_year_in_review():
    return render_template("2013.html")


@app.route("/create")
def create_page():
    return redirect("signup", 301)









###############################################################################
#
#   WIDGET STUFF
#
###############################################################################



@app.route("/embed/impactstory.js")
@app.route("/embed/v1/impactstory.js")
def impactstory_dot_js():
    abort(410)



@app.route('/logo')
def logo():
    filename = "static/img/logos/impactstory-logo-big.png"
    return send_file(filename, mimetype='image/png')

@app.route('/logo/small')
def logo_small():
    filename = "static/img/impactstory-logo.png"
    return send_file(filename, mimetype='image/png')



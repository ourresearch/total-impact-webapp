import requests, os, json, logging, re, datetime
import analytics
from util import local_sleep

from flask import request, send_file, abort, make_response, g, redirect
from flask import render_template
from flask import render_template_string
from flask.ext.login import login_user, logout_user, current_user, login_required

from totalimpactwebapp import app, db, login_manager, products_list, product

from totalimpactwebapp.password_reset import send_reset_token
from totalimpactwebapp.password_reset import reset_password_from_token
from totalimpactwebapp.password_reset import reset_password
from totalimpactwebapp.password_reset import PasswordResetError

from totalimpactwebapp import user
from totalimpactwebapp.user import User
from totalimpactwebapp.user import create_user_from_slug
from totalimpactwebapp.user import get_user_from_id
from totalimpactwebapp.user import delete_user

from totalimpactwebapp.card_generate import *
from totalimpactwebapp import emailer
from totalimpactwebapp import thresholds

from totalimpactwebapp.user import remove_duplicates_from_user
from totalimpactwebapp.user import get_products_from_core_as_csv
from totalimpactwebapp.user import EmailExistsError
from totalimpactwebapp.utils.unicode_helpers import to_unicode_or_bust
from totalimpactwebapp.util import camel_to_snake_case
from totalimpactwebapp import views_helpers
from totalimpactwebapp import welcome_email
from totalimpactwebapp import event_monitoring


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


def abort_if_user_not_logged_in(profile):
    allowed = True
    try:
        if current_user.id != profile.id:
            abort_json(401, "You can't do this because it's not your profile.")
    except AttributeError:
        abort_json(405, "You can't do this because you're not logged in.")



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
def redirect_to_https():
    try:
        if request.headers["X-Forwarded-Proto"] == "https":
            pass
        else:
            return redirect(request.url.replace("http://", "https://"), 301)  # permanent
    except KeyError:
        logger.debug(u"There's no X-Forwarded-Proto header; assuming localhost, serving http.")


@app.before_request
def redirect_www_to_naked_domain():
    if request.url.startswith("https://www.impactstory.org"):

        new_url = request.url.replace(
            "https://www.impactstory.org",
            "https://impactstory.org"
        )
        logger.debug(u"URL starts with www; redirecting to " + new_url)
        return redirect(new_url, 301)  # permanent




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
        user_info = g.user.dict_about(include_stripe=True)

    except AttributeError:  # anon user has no as_dict()
        user_info = None

    return json_resp_from_thing({"user": user_info})



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

    return json_resp_from_thing({"user": user.dict_about(include_stripe=True)})






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

    welcome_email.send_welcome_email(user.email, user.given_name)
    event_monitoring.new_user(user.url_slug, user.given_name)
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


@app.route("/user/<profile_id>/about", methods=['GET'])
def user_about(profile_id):
    user = get_user_for_response(profile_id, request)
    dict_about = user.dict_about()
    logger.debug(u"got the user dict out: {user}".format(
        user=dict_about))

    return json_resp_from_thing({"about": dict_about})


@app.route("/user/<profile_id>/about", methods=['PATCH'])
def patch_user_about(profile_id):

    profile = get_user_for_response(profile_id, request)
    abort_if_user_not_logged_in(profile)

    logger.debug(
        u"got patch request for profile {profile_id} (PK {pk}): '{log}'. {json}".format(
        profile_id=profile_id,
        pk=profile.id,
        log=request.args.get("log", "").replace("+", " "),
        json=request.json)
    )

    profile.patch(request.json["about"])
    db.session.commit()

    return json_resp_from_thing({"about": profile.dict_about()})


@app.route("/user/<profile_id>/credit_card/<stripe_token>", methods=["POST"])
def user_credit_card(profile_id, stripe_token):
    profile = get_user_for_response(profile_id, request)
    abort_if_user_not_logged_in(profile)

    ret = user.upgrade_to_premium(profile, stripe_token)
    return json_resp_from_thing({"result": ret})


@app.route("/user/<profile_id>/subscription", methods=["DELETE"])
def user_subscription(profile_id):
    profile = get_user_for_response(profile_id, request)
    abort_if_user_not_logged_in(profile)

    if request.method == "DELETE":
        ret = user.cancel_premium(profile)

    return json_resp_from_thing({"result": ret})



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

    source = request.args.get("source", "webapp")

    try:
        if current_user.url_slug == user.url_slug:
            user.update_last_viewed_profile()
    except AttributeError:   #AnonymousUser
        pass

    if request.args.get("group_by")=="duplicates":
        resp = products_list.get_duplicates_list_from_tiids(user.tiids)
    else:        
        display_debug = request.args.get("debug", "unset") != "unset"
        include_headings = request.args.get("include_heading_products") in [1, "true", "True"]
        resp = products_list.prep(
            user.products,
            include_headings,
            display_debug
        )

    return json_resp_from_thing(resp)


@app.route("/product/<tiid>/biblio", methods=["PATCH"])
def product_biblio_modify(tiid):

    try:
        if tiid not in current_user.tiids:
            abort_json(401, "You have to own this product to modify it.")
    except AttributeError:
        abort_json(405, "You musts be logged in to modify products.")

    query = u"{core_api_root}/v1/product/{tiid}/biblio?api_admin_key={api_admin_key}".format(
        core_api_root=os.getenv("API_ROOT"),
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

    source = request.args.get("source", "webapp")

    if request.method == "POST" and action == "deduplicate":
        deleted_tiids = remove_duplicates_from_user(user.id)
        resp = {"deleted_tiids": deleted_tiids}

    elif request.method == "POST" and (action == "refresh"):
        tiids_being_refreshed = user.refresh_products(source)
        resp = {"products": tiids_being_refreshed}

    else:

        # Actions that require authentication
        abort_if_user_not_logged_in(user)

        if request.method == "PATCH":
            added_products = user.add_products(request.json)
            resp = {"products": added_products}

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

    r = get_products_from_core_as_csv(tiids)
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

    # if add products is coming from a scheduled source, don't add if previously removed
    source = request.args.get("source", "webapp")    
    update_even_removed_products = (source=="webapp")

    tiids = user.update_products_from_linked_account(account, update_even_removed_products)
    return json_resp_from_thing({"products": tiids})



#------------------ /providers  (information about providers) -----------------
@app.route('/providers', methods=["GET"])
def providers():
    try:
        url = u"{api_root}/v1/provider?key={api_key}".format(
            api_key=os.getenv("API_KEY"),
            api_root=os.getenv("API_ROOT"))
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
def google_verification_impactstory():
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
        api_root=os.getenv("API_ROOT"),
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

@app.route("/scratchpad")
def scratchpad():
    return render_template("scratchpad.html")


@app.route("/<profile_id>/cards")
def render_cards(profile_id):
    user = get_user_for_response(
        profile_id,
        request
    )
    cards = []
    cards += ProductNewMetricCardGenerator.make(user)
    card_dicts = [card.to_dict() for card in cards]

    print card_dicts

    return json_resp_from_thing(card_dicts)


@app.route("/test/email")
def test_emailer():

    ret = emailer.send(
        "wordslikethis@gmail.com",
        "this is a test email",
        "card",
        {"title": "my wonderful paper about rabbits"}
    )
    return json_resp_from_thing(ret)


@app.route("/thresholds")
def get_thresholds():

    return json_resp_from_thing(thresholds.values)

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



import requests
import os
import json
import logging
import re
import datetime
import analytics
import stripe


from util import local_sleep
from totalimpactwebapp import util

from flask import request, send_file, abort, make_response, g, redirect
from flask import render_template
from flask import render_template_string
from flask.ext.login import login_user, logout_user, current_user, login_required

from boto.s3.connection import S3ResponseError

from totalimpactwebapp import app
from totalimpactwebapp import db
from totalimpactwebapp import login_manager
from totalimpactwebapp import cache

from totalimpactwebapp.password_reset import send_reset_token
from totalimpactwebapp.password_reset import reset_password_from_token
from totalimpactwebapp.password_reset import reset_password
from totalimpactwebapp.password_reset import PasswordResetError

from totalimpactwebapp.profile import Profile
from totalimpactwebapp.profile import create_profile_from_slug
from totalimpactwebapp.profile import get_profile_from_id
from totalimpactwebapp.profile import delete_profile
from totalimpactwebapp.profile import remove_duplicates_from_profile
from totalimpactwebapp.profile import EmailExistsError
from totalimpactwebapp.profile import delete_products_from_profile
from totalimpactwebapp.profile import subscribe
from totalimpactwebapp.profile import unsubscribe
from totalimpactwebapp.profile import build_profile_dict
from totalimpactwebapp.product import get_product
from totalimpactwebapp.product import upload_file_and_commit
from totalimpactwebapp.product import add_product_embed_markup

from totalimpactwebapp.interaction import log_interaction_event

from totalimpactwebapp.cards_factory import *
from totalimpactwebapp import emailer
from totalimpactwebapp import configs

from totalimpactwebapp.util import camel_to_snake_case
from totalimpactwebapp import views_helpers
from totalimpactwebapp import welcome_email
from totalimpactwebapp import event_monitoring
from totalimpactwebapp import notification_report

from totalimpactwebapp.reference_set import RefsetBuilder

import newrelic.agent
from sqlalchemy import orm

logger = logging.getLogger("tiwebapp.views")
analytics.init(os.getenv("SEGMENTIO_PYTHON_KEY"), log_level=logging.INFO)












###############################################################################
#
#   CONVENIENCE FUNCTIONS
#
###############################################################################



def json_resp_from_thing(thing):
    my_dict = util.todict(thing)
    json_str = json.dumps(my_dict, sort_keys=True, indent=4)

    if request.path.endswith(".json") and (os.getenv("FLASK_DEBUG", False) == "True"):
        logger.info(u"rendering output through debug_api.html template")
        resp = make_response(render_template(
            'debug_api.html',
            data=json_str))
        resp.mimetype = "text/html"
        return views_helpers.bust_caches(resp)

    resp = make_response(json_str, 200)
    resp.mimetype = "application/json"
    return views_helpers.bust_caches(resp)




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

    retrieved_user = get_profile_from_id(
        id,
        id_type,
        show_secrets=logged_in,
        include_products=include_products
    )

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


def is_logged_in(profile):
    try:
        return current_user.id != profile.id
    except AttributeError:
        return False



def current_user_owns_tiid(tiid):
    try:
        profile = db.session.query(Profile).get(int(current_user.id))
        db.session.expunge(profile)
        return tiid in profile.tiids
    except AttributeError:  #Anonymous
        return False





###############################################################################
#
#   BEFORE AND AFTER REQUESTS
#
###############################################################################

@login_manager.user_loader
def load_user(profile_id):
    # load just the profile table, and don't keep it hooked up to sqlalchemy
    profile = db.session.query(Profile).options(orm.noload('*')).get(int(profile_id))
    if profile:
        db.session.expunge(profile)
    return profile



@app.before_request
def redirect_to_https():
    try:
        if request.headers["X-Forwarded-Proto"] == "https":
            pass
        else:
            return redirect(request.url.replace("http://", "https://"), 301)  # permanent
    except KeyError:
        #logger.debug(u"There's no X-Forwarded-Proto header; assuming localhost, serving http.")
        pass


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
    try:
        g.user_id = current_user.id
    except AttributeError:
        g.user_id = None

    g.api_root = os.getenv("API_ROOT")
    g.api_key = os.getenv("API_KEY")
    g.webapp_root = os.getenv("WEBAPP_ROOT_PRETTY", os.getenv("WEBAPP_ROOT"))



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
#   /profile/current
#
###############################################################################


@app.route("/profile/current")
def get_current_user():
    local_sleep(1)
    try:
        user_info = g.user.dict_about()
    except AttributeError:  # anon user has no as_dict()
        user_info = None

    return json_resp_from_thing({"user": user_info})


@app.route("/profile/current/notifications/<notification_name>", methods=["GET"])
def current_user_notifications(notification_name):

    # hardcode for now
    notification_name = "new_metrics_notification_dismissed"

    # it's Not RESTful to do this in a GET, but, whatevs.
    if request.args.get("action") == "dismiss":
        g.user.new_metrics_notification_dismissed = datetime.datetime.now()
        db.session.merge(g.user)
        db.session.commit()

    return json_resp_from_thing({"user": g.user.dict_about()})



@app.route('/profile/current/logout', methods=["POST", "GET"])
def logout():
    #sleep(1)
    logout_user()
    return json_resp_from_thing({"msg": "user logged out"})



@app.route("/profile/current/login", methods=["POST"])
def login():

    email = unicode(request.json["email"]).lower()
    password = unicode(request.json["password"])

    user = Profile.query.filter_by(email=email).first()

    if user is None:
        abort(404, "Email doesn't exist")
    elif not user.check_password(password):
        abort(401, "Wrong password")
    else:
        # Yay, no errors! Log the user in.
        login_user(user)

    return json_resp_from_thing({"user": user.dict_about()})














###############################################################################
#
#   /profile/:id
#
###############################################################################

def get_user_profile(profile_id):
    resp_constr_timer = util.Timer()

    profile = get_user_for_response(
        profile_id,
        request
    )

    hide_keys = request.args.get("hide", "").split(",")
    embed = request.args.get("embed")

    profile_dict = build_profile_dict(profile, hide_keys, embed)

    logger.debug(u"/profile/{slug} built the response; took {elapsed}ms".format(
        slug=profile.url_slug,
        elapsed=resp_constr_timer.elapsed()
    ))
    return profile_dict


@app.route("/profile/<profile_id>", methods=['GET'])
@app.route("/profile/<profile_id>.json", methods=['GET'])
def user_profile(profile_id):
    resp = get_user_profile(profile_id)
    resp = json_resp_from_thing(resp)
    return resp


@app.route("/profile-without-products/<profile_id>", methods=["GET"])
def profile_without_products(profile_id):
    profile = get_user_for_response(profile_id, request, include_products=False)
    dict_about = profile.dict_about(show_secrets=False)
    return json_resp_from_thing(dict_about)


@app.route("/profile/<profile_id>/about", methods=["GET"])
def profile_about(profile_id):
    profile = get_user_for_response(profile_id, request, include_products=False)
    dict_about = profile.dict_about(show_secrets=False)
    return json_resp_from_thing(dict_about)



@app.route("/profile/<profile_id>", methods=["POST"])
@app.route("/profile/<profile_id>.json", methods=["POST"])
def create_new_user_profile(profile_id):
    userdict = {camel_to_snake_case(k): v for k, v in request.json.iteritems()}

    try:
        new_profile = create_profile_from_slug(profile_id, userdict, db)

    except EmailExistsError:
        abort_json(409, "That email already exists.")

    welcome_email.send_welcome_email(new_profile.email, new_profile.given_name)
    event_monitoring.new_user(new_profile.url_slug, new_profile.given_name)
    login_user(new_profile)
    return json_resp_from_thing({"user": new_profile.dict_about()})



@app.route("/profile/<profile_id>", methods=["DELETE"])
@app.route("/profile/<profile_id>.json", methods=["DELETE"])
def user_delete(profile_id):
    if not has_admin_authorization():
        abort_json(401, "Need admin key to delete users")

    user = get_user_for_response(profile_id, request)
    delete_profile(user)
    return json_resp_from_thing({"user": "deleted"})


@app.route("/profile/<profile_id>/subscription", methods=["DELETE", "POST"])
def user_subscription(profile_id):
    profile = get_user_for_response(profile_id, request)
    abort_if_user_not_logged_in(profile)

    if request.method == "DELETE":
        ret = unsubscribe(profile)

    elif request.method == "POST":
        try:
            ret = subscribe(
                profile,
                stripe_token=request.json["token"],
                coupon=request.json["coupon"],
                plan=request.json["plan"]
            )
        except (stripe.InvalidRequestError, stripe.CardError) as e:
            return abort_json(400, e.message)


    return json_resp_from_thing({"result": ret})




@app.route("/profile/<profile_id>", methods=['PATCH'])
@app.route("/profile/<profile_id>.json", methods=['PATCH'])
def patch_user_about(profile_id):

    profile = get_user_for_response(profile_id, request)
    abort_if_user_not_logged_in(profile)

    profile.patch(request.json["about"])
    db.session.commit()

    return json_resp_from_thing({"about": profile.dict_about()})



@app.route("/profile/<profile_id>/refresh_status", methods=["GET"])
@app.route("/profile/<profile_id>/refresh_status.json", methods=["GET"])
def refresh_status(profile_id):
    local_sleep(0.5) # client to webapp plus one trip to database
    id_type = request.args.get("id_type", "url_slug")  # url_slug is default    
    profile_bare_products = get_profile_from_id(profile_id, id_type, include_product_relationships=False)
    return json_resp_from_thing(profile_bare_products.get_refresh_status())















###############################################################################
#
#   /profile/:id/pinboard
#
###############################################################################

@app.route("/profile/<id>/pinboard", methods=["POST", "GET"])
def profile_pinboard(id):
    pass  # save and get stuff.






###############################################################################
#
#   /profile/:id/products
#
###############################################################################


@app.route("/profile/<id>/products", methods=["POST", "PATCH"])
@app.route("/profile/<id>/products.json", methods=["POST", "PATCH"])
def user_products_modify(id):

    action = request.args.get("action", "refresh")
    user = get_user_for_response(id, request)
    # logger.debug(u"got user {user}".format(
    #     user=user))

    source = request.args.get("source", "webapp")

    if request.method == "POST" and action == "deduplicate":
        deleted_tiids = remove_duplicates_from_profile(user.id)
        resp = {"deleted_tiids": deleted_tiids}
        local_sleep(30)

    elif request.method == "POST" and (action == "refresh"):
        tiids_being_refreshed = user.refresh_products(source)
        resp = {"products": tiids_being_refreshed}

    else:

        # Actions that require authentication
        abort_if_user_not_logged_in(user)

        if request.method == "PATCH":
            local_sleep(2)
            added_products = user.add_products(request.json)
            resp = {"products": added_products}

        else:
            abort(405)  # method not supported.  We shouldn't get here.

    return json_resp_from_thing(resp)


@app.route("/profile/<user_id>/product/<tiid>", methods=['GET', 'DELETE'])
@app.route("/profile/<user_id>/product/<tiid>.json", methods=['GET', 'DELETE'])
def user_product(user_id, tiid):

    if user_id == "embed":
        abort(410)

    profile = get_user_for_response(user_id, request)

    if request.method == "GET":
        markup_factory = MarkupFactory(g.user_id, embed=False)
        try:
            resp = profile.get_single_product_markup(tiid, markup_factory)
        except IndexError:
            abort_json(404, "That product doesn't exist.")

    elif request.method == "DELETE":
        # kind of confusing now, waiting for core-to-webapp refactor
        # to improve it though.
        abort_if_user_not_logged_in(profile)
        resp = delete_products_from_profile(profile, [tiid])

    return json_resp_from_thing(resp)


@app.route("/product/<tiid>/pdf", methods=['GET'])
def product_pdf(tiid):

    if request.method == "GET":
        try:
            product = get_product(tiid)
            pdf = product.get_pdf()
            if pdf:
                resp = make_response(pdf, 200)
                resp.mimetype = "application/pdf"
                resp.headers.add("Content-Disposition",
                                 "attachment; filename=impactstory-{tiid}.pdf".format(
                                    tiid=tiid))   
                return resp

            else:
                abort_json(404, "This product exists, but has no pdf.")

        except IndexError:
            abort_json(404, "That product doesn't exist.")
        except S3ResponseError:
            abort_json(404, "This product exists, but has no pdf.")


@app.route("/pdf/<path:pdf_url>", methods=['GET'])
def pdf_proxy(pdf_url):
    r = requests.get(pdf_url, timeout=30)
    pdf = r.content
    resp = make_response(pdf, 200)
    resp.mimetype = "application/pdf"
    resp.headers.add("Content-Disposition",
                     "attachment; filename=impactstory.pdf")   
    return resp


@app.route("/product/<tiid>/embed-markup", methods=['GET'])
def product_embed_markup(tiid):
    product = get_product(tiid)
    html_markup = product.get_embed_markup()
    return json_resp_from_thing({"html": html_markup})


@app.route("/product/<tiid>/interaction", methods=["POST"])
def product_interaction(tiid):
    if current_user_owns_tiid(tiid):
        logger.info(u"not logging pageview for {tiid} because current user viewing own tiid".format(
            tiid=tiid))
    else:
        logger.info(u"logging pageview for {tiid}".format(
            tiid=tiid))
        log_interaction_event(tiid=tiid,
            event=request.json.get("event", "views"),
            headers=request.headers.to_list(),
            ip=request.remote_addr,
            timestamp=request.json.get("timestamp", datetime.datetime.utcnow()))

    return json_resp_from_thing(request.json)


@app.route("/product/<tiid>", methods=["GET"])
def product_without_needing_profile(tiid):
    product = get_product(tiid)
    return json_resp_from_thing(product)


@app.route("/product/<tiid>/file", methods=['GET', 'POST'])
def product_file(tiid):

    if request.method == "GET":
        try:
            product = get_product(tiid)

            if product.has_file:
                my_file = product.get_file()
                resp = make_response(my_file, 200)
                return resp
            else:
                abort_json(404, "This product exists, but has no file.")

        except IndexError:
            abort_json(404, "That product doesn't exist.")
        except S3ResponseError:
            abort_json(404, "This product exists, but has no file.")


    elif request.method == "POST":
        try:
            if not current_user_owns_tiid(tiid):
                abort_json(401, "You have to own this product to add files.")
        except AttributeError:
            abort_json(405, "You must be logged in to upload files.")

        file_to_upload = request.files['file'].stream
        product = get_product(tiid)      
        resp = upload_file_and_commit(product, file_to_upload, db)

        return json_resp_from_thing(resp)



@app.route("/profile/<profile_id>/products.csv", methods=["GET"])
def profile_products_csv(profile_id):
    profile = get_user_for_response(profile_id, request)

    csv = profile.csv_of_products()

    resp = make_response(csv, 200)
    resp.mimetype = "text/csv;charset=UTF-8"
    resp.headers.add("Content-Disposition",
                     "attachment; filename=impactstory-{profile_id}.csv".format(
                        profile_id=profile_id))
    resp.headers.add("Content-Encoding",
                     "UTF-8")
    return resp


@app.route("/product/<tiid>/biblio", methods=["PATCH"])
@app.route("/product/<tiid>/biblio.json", methods=["PATCH"])
def product_biblio_modify(tiid):
    # This should actually be like /profile/:id/product/:tiid/biblio
    # and it should return the newly-modified product, instead of the
    # part-product it gets from core now.

    try:
        if not current_user_owns_tiid(tiid):
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

    # has to be after database call above
    add_product_embed_markup(tiid)
    local_sleep(1)

    return json_resp_from_thing(r.json())




@app.route("/test-pdf")
def test_pdf():
    filename = "static/SCIM-S-13-00955.pdf"
    return send_file(filename, mimetype='application/pdf')






###############################################################################
#
#   misc endpoints
#
###############################################################################




@app.route("/profile/<id>/password", methods=["POST"])
def user_password_modify(id):

    current_password = request.json.get("currentPassword", None)
    new_password = request.json.get("newPassword", None)
    id_type = request.args.get("id_type", "url_slug")  # url_slug is default

    try:
        if id_type == "reset_token":
            user = reset_password_from_token(id, request.json["newPassword"])
        else:
            user = reset_password(id, id_type, current_password, new_password)

    except PasswordResetError as e:
        abort_json(403, e.message)

    db.session.commit()
    return json_resp_from_thing({"about": user.dict_about()})


@app.route("/profile/<id>/password", methods=["GET"])
def get_password_reset_link(id):
    if request.args.get("id_type") != "email":
        abort_json(400, "id_type param must be 'email' for this endpoint.")

    retrieved_user = get_user_for_response(id, request)

    ret = send_reset_token(retrieved_user.email, request.url_root)
    return json_resp_from_thing({"sent_reset_email": ret})



@app.route("/profile/<id>/linked-accounts/<account>", methods=["POST"])
def user_linked_accounts_update(id, account):
    profile = get_user_for_response(id, request)

    # if add products is coming from a scheduled source, don't add if previously removed
    source = request.args.get("source", "webapp")    
    update_even_removed_products = (source=="webapp")

    tiids = profile.update_products_from_linked_account(account, update_even_removed_products)

    return json_resp_from_thing({"products": tiids})



@app.route('/providers', methods=["GET"])  # information about providers
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




@app.route("/tests", methods=["DELETE"])  # supports functional testing
def delete_all_test_users():
    if not has_admin_authorization():
        abort_json(401, "Need admin key to delete all test users")

    email_suffex_for_text_accounts = "@test-impactstory.org"
    users = Profile.query.filter(Profile.email.like("%"+email_suffex_for_text_accounts)).all()
    user_slugs_deleted = []
    for user in users:
        user_slugs_deleted.append(user.url_slug)
        delete_profile(user)
    return json_resp_from_thing({"test_users": user_slugs_deleted})




###############################################################################
#
#   REFERENCE SETS
#
###############################################################################




@app.route("/reference-set-histograms")
def reference_sets():
    rows = RefsetBuilder.export_csv_rows()

    resp = make_response("\n".join(rows), 200)

    # resp.mimetype = "text/text;charset=UTF-8"

    # Do we want it to pop up to save?  kinda nice to just see it in browser
    resp.mimetype = "text/csv;charset=UTF-8"
    #resp.headers.add("Content-Disposition", "attachment; filename=refsets.csv")
    resp.headers.add("Content-Encoding", "UTF-8")

    return resp







###############################################################################
#
#   MOSTLY-STATIC PAGES
#
###############################################################################




@app.route("/<path:page>")  # from http://stackoverflow.com/a/14023930/226013
@app.route("/")
def redirect_to_profile(page="index"):
    """
    EVERYTHING not explicitly routed to another view function will end up here.
    """

    # first, serve pre-rendered pages to search engines:
    useragent = request.headers.get("User-Agent", "").lower()
    crawer_useragent_fragments = ["googlebot", "bingbot"]

    for useragent_fragment in crawer_useragent_fragments:
        if useragent_fragment in useragent:
            page = page.replace("/", "_")
            file_template = u"static/rendered-pages/{page}.html"
            try:
                return send_file(file_template.format(page=page))
            except (IOError, UnicodeEncodeError):
                # eventually, render the page on the fly
                # for now, just return what the user sees
                return render_template('index.html')  

    # not a search engine?  return the page
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

    try:
        current_user_dict = current_user.dict_about()
    except AttributeError:
        current_user_dict = None

    return make_js_response(
        "top.js.tpl",
        segmentio_key=os.getenv("SEGMENTIO_KEY"),
        mixpanel_token=os.getenv("MIXPANEL_TOKEN"),
        stripe_publishable_key=os.getenv("STRIPE_PUBLISHABLE_KEY"),
        newrelic_header=newrelic_header,
        current_user=current_user_dict
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



@app.route("/<profile_id>/cards.json")
def render_cards_json(profile_id):
    profile = get_user_for_response(
        profile_id,
        request
    )
    cards = notification_report.get_all_cards(profile)
    return json_resp_from_thing(cards)


@app.route("/<profile_id>/report")
def render_notification_report(profile_id, format="html"):
    user = get_user_for_response(
        profile_id,
        request
    )
    report_context = notification_report.make(user)
    return render_template("report.html", **report_context)




@app.route("/test/email")
def test_emailer():

    ret = emailer.send(
        "wordslikethis@gmail.com",
        "this is a test email",
        "card",
        {"title": "my wonderful paper about rabbits"}
    )
    return json_resp_from_thing(ret)


@app.route("/configs/metrics")
def get_configs():
    return json_resp_from_thing(configs.metrics())

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
    filename = "static/img/impactstory-logo-sideways-big.png"
    return send_file(filename, mimetype='image/png')

@app.route('/logo/small')
def logo_small():
    filename = "static/img/impactstory-logo.png"
    return send_file(filename, mimetype='image/png')

@app.route('/advisor.png')
def advisor_badge():
    filename = "static/img/advisor-badge.png"
    return send_file(filename, mimetype='image/png')



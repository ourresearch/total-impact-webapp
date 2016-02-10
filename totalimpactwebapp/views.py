import requests
import os
import json
import logging
import re
import datetime
import analytics
import stripe
from collections import defaultdict
from time import sleep

from util import local_sleep
from util import commit
import util

from flask import request, send_file, abort, make_response, g, redirect
from flask import render_template
from flask import render_template_string
from flask.ext.login import login_user, logout_user, current_user, login_required

from boto.s3.connection import S3ResponseError

from totalimpactwebapp import app
from totalimpactwebapp import db
from totalimpactwebapp import login_manager
from totalimpactwebapp.countries import get_country_names_from_iso
from totalimpactwebapp import unis

from totalimpactwebapp.password_reset import send_reset_token
from totalimpactwebapp.password_reset import reset_password_from_token
from totalimpactwebapp.password_reset import reset_password
from totalimpactwebapp.password_reset import PasswordResetError

from totalimpactwebapp.profile import Profile
from totalimpactwebapp.profile import create_profile_from_slug
from totalimpactwebapp.profile import get_profile_stubs_from_url_slug
from totalimpactwebapp.profile import get_profile_from_id
from totalimpactwebapp.profile import delete_profile
from totalimpactwebapp.profile import EmailExistsError
from totalimpactwebapp.profile import delete_products_from_profile
from totalimpactwebapp.profile import subscribe
from totalimpactwebapp.profile import unsubscribe
from totalimpactwebapp.profile import build_profile_dict
from totalimpactwebapp.profile import default_free_trial_days
from totalimpactwebapp.profile import get_profile_summary_dict

from totalimpactwebapp.product import Product
from totalimpactwebapp.product import get_product
from totalimpactwebapp.product import get_products_from_tiids
from totalimpactwebapp.product import upload_file_and_commit
from totalimpactwebapp.product import patch_biblio

from totalimpactwebapp.product_markup import Markup

from totalimpactwebapp.collection import Collection

from totalimpactwebapp import pinboard
from totalimpactwebapp.pinboard import Pinboard
from totalimpactwebapp.pinboard import write_to_pinboard

from totalimpactwebapp.interaction import log_interaction_event

from totalimpactwebapp.tweet import get_product_tweets_for_profile

from totalimpactwebapp.cards_factory import make_summary_cards
from totalimpactwebapp.card import GenreNewDiffCard
from totalimpactwebapp.card import GenreMetricSumCard
from totalimpactwebapp.card import GenreEngagementSumCard
import emailer
from totalimpactwebapp import configs

from util import camel_to_snake_case
from totalimpactwebapp import views_helpers
from totalimpactwebapp import welcome_email
from totalimpactwebapp import event_monitoring
from totalimpactwebapp import notification_report
from totalimpactwebapp.drip_email import drip_email_context

from totalimpactwebapp.reference_set import RefsetBuilder

from totalimpact.providers.provider import ProviderFactory
from totalimpact.providers import provider as provider_module



from sqlalchemy import orm
from sqlalchemy import or_

logger = logging.getLogger("ti.views")
analytics.init(os.getenv("SEGMENTIO_PYTHON_KEY"), log_level=logging.INFO)

USER_AGENT = "ImpactStory" # User-Agent string to use on HTTP requests
VERSION = "cristhian" # version






###############################################################################
#
#   CONVENIENCE FUNCTIONS
#
###############################################################################



def json_resp_from_thing(thing, is_already_a_dict=False):
    # @is_already_a_dict saves a bit of time if you've already converted to dict.
    if not is_already_a_dict:
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


def current_user_owns_profile(profile):
    try:
        return current_user.id == profile.id
    except AttributeError:  #Anonymous
        return False



def current_user_owns_tiid(tiid):
    try:
        profile_for_current_user = db.session.query(Profile).get(int(current_user.id))
        db.session.expunge(profile_for_current_user)
        return tiid in profile_for_current_user.tiids
    except AttributeError:  #Anonymous
        return False


def current_user_must_own_tiid(tiid):
    try:
        if not current_user_owns_tiid(tiid):
            abort_json(401, "You have to own this product to modify it.")
    except AttributeError:
        abort_json(405, "You must be logged in to modify products.")




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
        commit(db)

    return json_resp_from_thing({"user": g.user.dict_about()})



@app.route('/profile/current/logout', methods=["POST", "GET"])
def logout():
    #sleep(1)
    logout_user()
    return json_resp_from_thing({"msg": "user logged out"})



@app.route("/profile/current/login", methods=["POST"])
def login():
    email = unicode(request.json["email"])
    password = unicode(request.json["password"])

    if "@" in email:
        profile = Profile.query.filter_by(email=email.lower()).first()
    else:
        # maybe we got a url slug instead of an email
        profile = Profile.query.filter_by(url_slug=email).first()


    if profile is None:
        abort(404, "Email doesn't exist")
    elif not profile.check_password(password):
        abort(401, "Wrong password")
    else:
        # Yay, no errors! Log the user in.
        login_user(profile, remember=True)
        profile.update_last_viewed_profile(async=True)

    return json_resp_from_thing({"user": profile.dict_about()})














###############################################################################
#
#   /profile/:id
#
###############################################################################

def get_user_profile_dict(profile_id):
    resp_constr_timer = util.Timer()

    profile = get_user_for_response(
        profile_id,
        request
    )

    hide_keys = request.args.get("hide", "").split(",")
    embed = request.args.get("embed")

    profile_dict = build_profile_dict(profile, hide_keys, embed)

    logger.debug(u"took {elapsed}ms to build the response for /profile/{slug}".format(
        slug=profile.url_slug,
        elapsed=resp_constr_timer.elapsed()
    ))
    return profile_dict


@app.route("/profile/<profile_id>", methods=['GET'])
@app.route("/profile/<profile_id>.json", methods=['GET'])
def user_profile(profile_id):
    resp = get_user_profile_dict(profile_id)
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

    if current_user_owns_profile(profile):
        profile.update_last_viewed_profile(async=True)

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
    login_user(new_profile, remember=True)
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


@app.route("/profile/<profile_id>/pinboard", methods=["GET", "POST"])
def pinboard_endpoint(profile_id):
    profile = get_user_for_response(profile_id, request)

    if request.method == "GET":
        board = Pinboard.query.filter_by(profile_id=profile.id).first()
        try:
            resp = board.contents
        except AttributeError:
            abort_json(404, "user has no pinboard set yet.")

    elif request.method == "POST":
        abort_if_user_not_logged_in(profile)

        # debugging
        contents = request.json["contents"]
        product_pins = contents["one"]
        for (product_lable, tiid) in product_pins:
            current_user_must_own_tiid(tiid)
        resp = write_to_pinboard(profile.id, request.json["contents"])

    return json_resp_from_thing(resp)



@app.route("/profile/<profile_id>", methods=['PATCH'])
@app.route("/profile/<profile_id>.json", methods=['PATCH'])
def patch_user_about(profile_id):

    profile = get_user_for_response(profile_id, request)
    abort_if_user_not_logged_in(profile)

    profile.patch(request.json["about"])
    commit(db)

    return json_resp_from_thing({"about": profile.dict_about()})



@app.route("/profile/<profile_id>/refresh-status", methods=["GET"])
@app.route("/profile/<profile_id>/refresh-status.json", methods=["GET"])
def refresh_status(profile_id):
    local_sleep(0.5) # client to webapp plus one trip to database
    id_type = request.args.get("id_type", "url_slug")  # url_slug is default    
    profile_bare_products = get_profile_from_id(profile_id, id_type, include_product_relationships=False)
    if profile_bare_products:
        status = profile_bare_products.get_refresh_status()
    else:
        abort_json(404, "This profile does not exist.")        
    return json_resp_from_thing(status)



@app.route("/profile/<profile_id>/awards")
@app.route("/profile/<profile_id>/awards.json")
def oa_badge(profile_id):
    profile = get_user_for_response(profile_id, request)
    awards = profile.get_profile_awards()
    return json_resp_from_thing(awards)


@app.route("/profile/<profile_id>/key-metrics", methods=["GET", "POST"])
@app.route("/profile/<profile_id>/key-metrics.json", methods=["GET", "POST"])
def key_metrics(profile_id):
    resp = []
    profile = get_user_for_response(profile_id, request)

    if request.method == 'GET':
        board = Pinboard.query.filter_by(profile_id=profile.id).first()
        if board is None:
            board = pinboard.save_new_board(profile.id)

        genre_cards = []
        for genre in profile.genres:
            this_genre_cards = genre.cards
            genre_cards += this_genre_cards

        for card_address in board.contents["two"]:
            card_address_parts = card_address.split(".")
            genre_name = card_address_parts[1]
            card_type = card_address_parts[3]
            genre_products = [p for p in profile.display_products if p.genre==genre_name]
            if card_type == "engagement":
                engagement_type = card_address_parts[4]
                card = GenreEngagementSumCard(genre_products, engagement_type, profile.url_slug)
            else:
                provider = card_address_parts[4]
                interaction = card_address_parts[5]
                card = GenreMetricSumCard(genre_products, provider, interaction, profile.url_slug)
            if card.current_value:
                resp.append(card)


    elif request.method == 'POST':
        key_metrics = request.json["contents"]
        card_addresses = [card['genre_card_address'] for card in key_metrics]
        resp = {
            "resp": pinboard.set_key_metrics(profile.id, card_addresses)
        }

    return json_resp_from_thing(resp)



@app.route("/profile/<profile_id>/key-products", methods=["GET", "POST"])
@app.route("/profile/<profile_id>/key-products.json", methods=["GET", "POST"])
def key_products(profile_id):

    # products are loaded individually below
    profile = get_user_for_response(profile_id, request, include_products=False)
    resp = []
    if request.method == "GET":
        markup = Markup(profile_id, False)  # profile_id must be a slug...

        board = Pinboard.query.filter_by(profile_id=profile.id).first()
        if board is None:
            board = pinboard.save_new_board(profile.id)

        show_keys = [
            # for rendering biblio
            "biblio",
            "embed_markup",

            "_tiid",
            "tiid",
            "markup",
            "genre",
            "genre_icon"
        ]
        tiids = [address[1] for address in board.contents["one"]]
        products = get_products_from_tiids(tiids)
        for my_product in products:
            my_product_dict = my_product.to_markup_dict(markup, show_keys=show_keys)
            resp.append(my_product_dict)

    elif request.method == 'POST':
        products = request.json["contents"]
        id_tuples = [('product', p["_tiid"]) for p in products]
        resp = {"resp": pinboard.set_key_products(profile.id, id_tuples)}

    return json_resp_from_thing(resp)



@app.route("/profile/<url_slug>/countries")
@app.route("/profile/<url_slug>/countries.json")
def profile_countries(url_slug):
    profile = get_user_for_response(url_slug, request)
    resp = profile.countries
    return json_resp_from_thing(resp)



###############################################################################
#
#   /profile/:id/products
#
###############################################################################


@app.route("/profile/<url_slug>/products", methods=["GET"])
@app.route("/profile/<url_slug>/products.json", methods=["GET"])
def profile_products_get(url_slug):

    action = request.args.get("action", "refresh")
    source = request.args.get("source", "webapp")
    timer = util.Timer()

    load_times = {}
    just_stubs = request.args.get("stubs", "False").lower() in ["1", "true"]
    if just_stubs:
        profile = get_profile_stubs_from_url_slug(url_slug)
        if not profile:
            abort_json(404, "This profile does not exist.")
        load_times["profile"] = timer.elapsed()
        product_list = [
            {"tiid": p.tiid, "genre": p.genre}
            for p in profile.products_not_removed
            if p.genre not in ["account"]
        ]
        load_times["product_list"] = timer.since_last_check()

    else:
        profile = get_profile_from_id(url_slug)
        if not profile:
            abort_json(404, "This profile does not exist.")

        markup = Markup(url_slug, embed=False)
        load_times["profile"] = timer.elapsed()

        product_list = profile.get_products_markup(
            markup=markup,
            show_keys=[
                # for rendering biblio
                "biblio",
                "embed_markup",

                "_tiid",
                "tiid",
                "markup",
                "countries_str",

                # for sorting
                "year",
                "title",
                "awardedness_score",
                "metrics_raw_sum",
                "authors",

                # misc
                "genre",
                "genre_icon"
            ]
        )
        load_times["product_list"] = timer.since_last_check()

    product_dicts_list = util.todict(product_list)
    resp = {
        "a_load_times": load_times,
        "is_refreshing": profile.is_refreshing,
        "list": product_dicts_list
    }
    return json_resp_from_thing(resp)



@app.route("/profile/<id>/products", methods=["POST", "PATCH", "DELETE"])
@app.route("/profile/<id>/products.json", methods=["POST", "PATCH", "DELETE"])
def profile_products_modify(id):

    action = request.args.get("action", "refresh")
    source = request.args.get("source", "webapp")

    profile = get_user_for_response(id, request)

    if request.method == "POST" and action == "after-refresh-cleanup":
        logger.info(u"deduplicating for {url_slug}".format(
            url_slug=profile.url_slug))
        deleted_tiids = profile.remove_duplicates()
        logger.info(u"parse_and_save_tweets for {url_slug}".format(
            url_slug=profile.url_slug))
        profile.parse_and_save_tweets()
        resp = {"deleted_tiids": deleted_tiids}
        # local_sleep(30)

    if request.method == "POST" and action == "dedup":
        logger.info(u"deduplicating for {url_slug}".format(
            url_slug=profile.url_slug))
        deleted_tiids = profile.remove_duplicates()
        resp = {"deleted_tiids": deleted_tiids}
        # local_sleep(30)

    elif request.method == "POST" and action == "refresh":
        tiids_being_refreshed = profile.refresh_products(source)
        resp = {"products": tiids_being_refreshed}

    else:
        # Actions that require authentication
        abort_if_user_not_logged_in(profile)
        local_sleep(2)

        if request.method == "PATCH":
            added_products = profile.add_products(request.json)
            resp = {"products": added_products}

        elif request.method == "DELETE":
            tiids_to_delete = request.args.get("tiids", []).split(",")
            resp = delete_products_from_profile(profile, tiids_to_delete)

        else:
            abort(405)  # method not supported.  We shouldn't get here.

    return json_resp_from_thing(resp)


@app.route("/profile/<url_slug>/products/tweets", methods=["GET"])
@app.route("/profile/<url_slug>/products/tweets.json", methods=["GET"])
def get_profile_tweets(url_slug):
    profile = get_user_for_response(url_slug, request, include_products=False)

    tweets = get_product_tweets_for_profile(profile.id)
    resp = {
        "tweets": tweets
    }
    return json_resp_from_thing(resp)




@app.route("/profile/<url_slug>/collection/<tagspace>/<tag>/products", methods=["GET"])
@app.route("/profile/<url_slug>/collection/<tagspace>/<tag>/products.json", methods=["GET"])
def get_products_for_collection(url_slug, tagspace, tag):
    collection = Collection(url_slug, tagspace, tag)
    resp = dict([(tiid, {}) for tiid in collection.tiids])

    include = request.args.get("include", "").split(",")
    if "tweets" in include:
        for tiid, tweets_dict in collection.tweets_by_tiid.iteritems():
            resp[tiid].update(tweets_dict)
    if "markup" in include:
        for tiid, markup_dict in collection.markup_by_tiid.iteritems():
            resp[tiid].update(markup_dict)

    return json_resp_from_thing(resp)


@app.route("/profile/<url_slug>/collection/<tagspace>/<tag>/summary-cards", methods=['GET'])
@app.route("/profile/<url_slug>/<tagspace>/<tag>/summary-cards.json", methods=['GET'])
def get_summary_cards_for_collection(url_slug, tagspace, tag):
    collection = Collection(url_slug, tagspace, tag)
    return json_resp_from_thing(collection.summary_cards)


@app.route("/profile/<url_slug>/collection/<tagspace>/<tag>/countries", methods=['GET'])
@app.route("/profile/<url_slug>/<tagspace>/<tag>/countries.json", methods=['GET'])
def get_countries_for_collection(url_slug, tagspace, tag):
    collection = Collection(url_slug, tagspace, tag)
    return json_resp_from_thing(collection.country_list)


@app.route("/product/<tiid>/pdf", methods=['GET'])
def product_pdf(tiid):

    if request.method == "GET":
        try:
            product = get_product(tiid)
            pdf = product.get_pdf()
            db.session.merge(product)  # get pdf might have cached the pdf
            commit(db)
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
        pass
        # logger.info(u"not logging pageview for {tiid} because current user viewing own tiid".format(
        #     tiid=tiid))
    else:
        # logger.info(u"logging pageview for {tiid}".format(
        #     tiid=tiid))
        log_interaction_event(tiid=tiid,
            event=request.json.get("event", "views"),
            headers=request.headers.to_list(),
            ip=request.remote_addr,
            timestamp=request.json.get("timestamp", datetime.datetime.utcnow()))

    return json_resp_from_thing(request.json)


@app.route("/product/<tiid>", methods=["GET"])
@app.route("/product/<tiid>.json", methods=["GET"])
def product_without_needing_profile(tiid):
    """
    I think this is unused, replaced by product_from_tiid.
    If it is used, it's broken because all the markups it gives just
    point to /jason profile.
    """
    local_sleep(1)

    product = get_product(tiid)
    if not product:
        return abort_json(404, "product not found")

    markup = Markup("jason", embed=False)
    product_dict = product.to_markup_dict(
        markup=markup
    )
    product_dict["metrics"] = product.metrics
    product_dict["countries"] = product.countries

    product_dict["metrics"] = product.metrics
    product_dict["countries"] = product.countries

    return json_resp_from_thing(product_dict)



@app.route("/profile/<url_slug>/product/<tiid>", methods=["GET"])
@app.route("/profile/<url_slug>/product/<tiid>.json", methods=["GET"])
def product_from_tiid(url_slug, tiid):
    local_sleep(1)

    product = get_product(tiid)
    if not product:
        abort_json(404, "This product does not exist.")

    product_dict = product.to_dict()
    return json_resp_from_thing(product_dict)


@app.route("/product/<tiid>/file", methods=['GET', 'POST'])
def product_file(tiid):

    if request.method == "GET":
        try:
            product = get_product(tiid)
            if not product:
                return abort_json(404, "product not found")

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
        current_user_must_own_tiid(tiid)
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

    current_user_must_own_tiid(tiid)
    resp = patch_biblio(tiid, request.json)
    local_sleep(1)

    return json_resp_from_thing({"msg": resp})




@app.route("/products/<comma_separated_tiids>/biblio", methods=["PATCH"])
@app.route("/products/<comma_separated_tiids>/biblio.json", methods=["PATCH"])
def products_biblio_modify_multi(comma_separated_tiids):
    resp = []
    for tiid in comma_separated_tiids.split(","):
        current_user_must_own_tiid(tiid)
        resp.append(patch_biblio(tiid, request.json))
        local_sleep(1)

    return json_resp_from_thing({"msg": resp})  # angular needs obj not array.




@app.route("/test-pdf")
def test_pdf():
    filename = "static/SCIM-S-13-00955.pdf"
    return send_file(filename, mimetype='application/pdf')






###############################################################################
#
#   misc endpoints
#
###############################################################################


@app.route("/coupons", methods=["POST"])
def buy_coupons():
    util.mint_stripe_coupon(
        request.json.get("stripeToken"),
        request.json.get("email"),
        request.json.get("cost"),
        request.json.get("numSubscriptions")
    )



    #   depending on how much money there is, set the max_redemptions
    # change the card using stripe
    # email the coupon code to the email address supplied
    # return success
    return json_resp_from_thing({"success": True})




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

    commit(db)
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
#   OTHER ROUTES
#
###############################################################################




@app.route("/<path:page>")  # from http://stackoverflow.com/a/14023930/226013
@app.route("/")
def redirect_to_profile(page="index"):
    """
    EVERYTHING not explicitly routed to another view function will end up here.
    """

    # first, serve pre-rendered index page for Bing
    useragent = request.headers.get("User-Agent", "").lower()
    crawer_useragent_fragments = ["bingbot"]

    for useragent_fragment in crawer_useragent_fragments:
        if useragent_fragment in useragent and page == "index":
            file_template = u"static/rendered-pages/{page}.html"
            return send_file(file_template.format(page=page))

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
        current_user=current_user_dict,
        genre_configs=configs.genre_configs(),
        country_names=get_country_names_from_iso()
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


@app.route("/<profile_id>/summary")
def render_profile_details(profile_id, format="html"):
    profile = get_user_for_response(profile_id, request)
    deets = get_profile_summary_dict(profile)
    return json_resp_from_thing(deets)


@app.route("/<profile_id>/notification-cards")
@app.route("/<profile_id>/notification-cards.json")
def notification_cards_json(profile_id):
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


@app.route("/<profile_id>/drip/<drip_milestone>")
def render_drip_email(profile_id, drip_milestone, format="html"):
    user = get_user_for_response(
        profile_id,
        request
    )
    email_context = drip_email_context(user, drip_milestone)
    return render_template(email_context["template"] + ".html", **email_context)


@app.route("/test/email")
def test_emailer():

    ret = emailer.send(
        "wordslikethis@gmail.com",
        "this is a test email",
        "card",
        {"title": "my wonderful paper about rabbits"}
    )
    return json_resp_from_thing(ret)


@app.route("/unis/<name_starts_with>")
def unis_route(name_starts_with):
    unis.load_list()
    unis_list = unis.filter_list(name_starts_with)
    return json_resp_from_thing(unis_list)



@app.route("/configs/metrics")
def get_configs():
    return json_resp_from_thing(configs.metrics())


@app.route("/configs/genres")
def get_genre_configs():
    return json_resp_from_thing(configs.genre_configs())

@app.route("/data/users/url-slugs")
def get_subscribed_user_url_slugs():
    q = db.session.query(Profile.url_slug)
    q = q.filter(
        or_(Profile.is_advisor!=None, 
            Profile.stripe_id!=None))  # not including trialling users
    response = q.order_by(Profile.url_slug).all()
    url_slugs = [resp.url_slug for resp in response]
    return json_resp_from_thing({"url_slugs": url_slugs})


@app.route('/providers', methods=["GET"])  # information about providers
def providers():
    metadata = ProviderFactory.get_all_metadata()
    metadata_list = []
    for k, v in metadata.iteritems():
        v["name"] = k
        metadata_list.append(v)

    return json_resp_from_thing(metadata_list)




###############################################################################
#
#   OTHER STUFF
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


# route to receive email
@app.route('/v1/inbox', methods=["POST"])
def inbox():
    payload = request.json
    email = incoming_email.save_incoming_email(payload)
    logger.info(u"You've got mail. Subject: {subject}".format(
        subject=email.subject))
    resp = make_response(json.dumps({"subject":email.subject}, sort_keys=True, indent=4), 200)
    return resp



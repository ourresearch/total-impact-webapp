import requests, os, json, logging, re, random, datetime, hashlib
import mandrill
import analytics

from flask import request, send_file, abort, make_response, g, redirect, url_for
from flask import render_template, flash
from flask.ext.assets import Environment, Bundle
from flask.ext.login import login_user, logout_user, current_user, login_required

from sqlalchemy.exc import IntegrityError, InvalidRequestError
from sqlalchemy import func
from itsdangerous import TimestampSigner, SignatureExpired, BadTimeSignature


from totalimpactwebapp import app, util, db, login_manager, forms
from totalimpactwebapp.user import User, create_user
from totalimpactwebapp import views_helpers
from totalimpactwebapp.utils.unicode_helpers import to_unicode_or_bust
import newrelic.agent

logger = logging.getLogger("tiwebapp.views")
analytics.init(os.getenv("SEGMENTIO_PYTHON_KEY"), log_level=logging.INFO)


assets = Environment(app)
js = Bundle(
            'js/bootstrap.js',
            'js/bootstrapx-clickover.js',
            'js/bootstrap-editable.js',
            'js/prettify.js',
            'js/underscore.js',
            'js/hmac-sha1.js',
            'js/jquery.placeholder.js',
            'js/jquery.headerlinks.js',
            'js/jquery.color.js',
            'js/jquery.cookie.js',
            'js/icanhaz.js',
            'js/ti-item.js',
            'js/ti-user.js',
            'js/ti-aliaslist.js',
            'js/ti-coll.js',
            'js/ti-userPreferences.js',
            'js/ti-userCreds.js',
            'js/ti-userProfile.js',
            'js/ti-ui.js',
            'js/google-analytics.js',
            'js/segmentio.js',
            'js/ti-analytics.js',

            output='js/packed.js'
)


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
assets.register('js_all', js)



def json_for_client(obj_or_dict):
    """
    JSON-serialize an obj or dict and put it in a Flask response.

    :param obj: the obj you want to serialize to json and send back
    :return: a flask json response, ready to send to client
    """

    # convert to a dict if it's not one already
    try:
        temp = obj_or_dict.__dict__
    except AttributeError:
        temp = obj_or_dict

    obj_dict = {}
    for k, v in temp.iteritems():
        if k[0] != "_":  # no private attributes

            if type(v) is datetime.datetime: # convert datetimes to strings
                obj_dict[k] = v.isoformat()
            else:
                obj_dict[k] = v

    resp = make_response(json.dumps(obj_dict, sort_keys=True, indent=4), 200)
    resp.mimetype = "application/json"
    return resp

def render_template_custom(template_name, **kwargs):
    kwargs["newrelic_footer"] = newrelic.agent.get_browser_timing_footer()
    if os.getenv("STATUS_SLOW", False) in [True, "true", "True", 1]:
        flash(
            "<strong>Performance notice:</strong> our server is currently backed up. We're fixing it now; see our <a href='http://twitter.com/impactstory_now'>status feed</a> for updates.",
            "error"
        )

    return render_template(template_name, **kwargs)

def get_user_from_id(userId):
    retrieved_user = User.query.get(userId)
    if retrieved_user is None:
        abort(404, "That user doesn't exist.")

    return retrieved_user



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
    g.roots = {
        "api": os.getenv("API_ROOT"),
        "api_pretty": os.getenv("API_ROOT_PRETTY", os.getenv("API_ROOT")),
        "webapp": os.getenv("WEBAPP_ROOT"),
        "webapp_pretty": os.getenv("WEBAPP_ROOT_PRETTY", os.getenv("WEBAPP_ROOT"))
    }

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
def add_trailing_slash_for_angular_pages():
    """
    Super hacky way to fix the /signup page for angular.js.

    This'll have to be improved if we end up with more angular pages.
    """

    if request.path == '/' or request.path == "/signup/":
        pass  # these trailing-slash pages are ok

    elif request.path == "/signup":
        return redirect("/signup/")  # angular.js likes the extra slash

    elif request.path.endswith("/"):
        return redirect(request.path[:-1])  # generally we dislike terminal slash

    else:
        pass  # no terminal slash, carry on here


@app.after_request
def add_crossdomain_header(resp):
    #support CORS
    resp.headers['Access-Control-Allow-Origin'] = "*"
    resp.headers['Access-Control-Allow-Methods'] = "POST, GET, OPTIONS, PUT, DELETE"
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
#   USER PAGES
#
###############################################################################


@app.route("/<path:dummy>")  # from http://stackoverflow.com/a/14023930/226013
def redirect_to_profile(dummy):
    """
    Route things that look like user profile urls.

    *Everything* not explicitly routed to another function will end up here.
    """
    return user_profile(dummy)


@app.route("/creating", methods=["POST"])
def creating_profile():
    user_request_dict = json.loads(request.form["user-dict-json"])
    user = create_user(user_request_dict, g.roots["api"], db)

    login_user(user)
    return redirect("/" + user.url_slug)


@app.route("/current-user")
def current_user():
    return json_for_client(current_user)



def user_profile(url_slug, new_user_request_obj=None):

    retrieved_user = User.query.filter(
        func.lower(User.url_slug) == func.lower(url_slug) ).first()

    # user don't exist
    if retrieved_user is None:
        abort(404)

    # you used a non-standard capitalization of the url slug
    elif retrieved_user.url_slug != url_slug:
        # redirect user to a URL that uses correctly-capitalized slug.
        return redirect("/" + retrieved_user.url_slug)

    # for now render something quite like the report template. change later.
    else:
        # if you're logged in
        if g.user.is_authenticated():
            # and you're looking at your own profile
            if g.user.id == retrieved_user.id:
                # note that you stopped by to view your profile
                retrieved_user.set_last_viewed_profile()
                db.session.add(retrieved_user)
                db.session.commit()

        email_hash = hashlib.md5(retrieved_user.email.lower()).hexdigest()

        return render_template_custom(
            'user-profile.html',
            email_hash=email_hash,
            profile=retrieved_user,
            report_id=retrieved_user.collection_id,
            report_id_namespace="impactstory_collection_id",
            api_query="collection/" + retrieved_user.collection_id
        )

@app.route("/<url_slug>/preferences")
def user_preferences(url_slug):

    retrieved_user = User.query.filter(
        func.lower(User.url_slug) == func.lower(url_slug) ).first()

    # user don't exist
    if retrieved_user is None:
        abort(404, "user doesn't exist")

    # you're not logged in
    elif not g.user.is_authenticated():
        return redirect(url_for('login', next=request.url))

    # you're logged in, asked to edit someone else's preferences
    elif g.user.id != retrieved_user.id:
        return redirect("/" + url_slug)

    # you used a non-standard capitalization of the url slug
    elif retrieved_user.url_slug != url_slug:
        # redirect user to a URL that uses correctly-capitalized slug.
        return redirect(url_for('user_preferences', url_slug=retrieved_user.url_slug))

    # yay, have some preferences page!
    else:
        return render_template_custom(
            'user-preferences.html',
            profile=retrieved_user
        )


@app.route("/user/<url_slug>")
def user_page_from_user_endpoint(url_slug):
    return redirect("/" + url_slug)


@app.route('/create', methods=["GET"])
def collection_create():

    # don't let logged-in users see the /create page.
    if g.user.is_authenticated():
        return redirect("/" + g.user.url_slug)


    return render_template_custom('create-collection.html')



@app.route('/signup/', methods=["GET"])
def signup():

    # don't let logged-in users see the /signup page.
    if g.user.is_authenticated():
        return redirect("/" + g.user.url_slug)

    return render_template_custom('signup.html')


@app.route("/signup/<path:path>")
def signup_static_resources(path):
    path_root = "static/src/signup/"
    full_path = path_root + path
    return send_file(full_path)






###############################################################################
#
#   USER LOGIN AND PASSWORD-MANAGEMENT PAGES
#
###############################################################################


@app.route("/user/login", methods=["POST"])
def login():

    logger.debug(u"user trying to log in.")

    email = unicode(request.json["email"]).lower()
    password = unicode(request.json["password"])

    g.user = User.query.filter_by(email=email).first()

    if g.user is None:
        abort(404, "Email doesn't exist")
    elif not g.user.check_password(password):
        abort(410, "Wrong password")
    else:
        # Yay, no errors! Log the user in.
        login_user(g.user)


    return json_for_client({"user": g.user.as_dict()})


@app.route('/logout')
def logout():
    logout_user()
    next = request.args.get("next", "")
    if next == "login":
        return redirect(url_for("login"))
    else:
        return redirect(url_for('index'))


@app.route("/reset-password", methods=["GET"])
def request_reset_token():
    logger.debug(u"user trying to reset password.")

    if g.user is not None and g.user.is_authenticated():
        return redirect("/" + g.user.url_slug + "/preferences")

    return render_template_custom('reset-password.html')



@app.route("/change-password/<reset_token>", methods=["GET", "POST"])
def change_password(reset_token):
    """
    Password change form; authenticates w/ token we've sent to user.
    """

    s = TimestampSigner(os.getenv("SECRET_KEY"), salt="reset-password")
    error = ""
    try:
        email = s.unsign(reset_token, max_age=60*60*24).lower()  # 24 hours

    except SignatureExpired:
        error = "expired-token"

    except BadTimeSignature:
        error = "invalid-token"

    if error:
        return render_template_custom("change-password.html", error=error)

    if request.method == "GET":
        return render_template_custom(
            'change-password.html',
            error=error
        )

    elif request.method == "POST":
        # the token is one we made. Whoever has it pwns this account
        retrieved_user = User.query.filter_by(email=email).first()
        if retrieved_user is None:
            abort(404, "Sorry, that user doesn't exist.")

        retrieved_user.set_password(request.form["confirm_new_pw"])
        login_user(retrieved_user)
        db.session.commit()
        flash("Password changed.", "success")
        return redirect("/" + retrieved_user.url_slug)


@app.route("/oauth/orcid")
def oath_orcid():
    return "placeholder for now..."







    ###############################################################################
#
#   JSON VIEWS (API)
#
###############################################################################



#------------------ /user -----------------

@app.route("/user", methods=["GET"])
def user_view():
    try:
        email = request.args["email"].lower()
    except AttributeError:
        abort(400, "Bad request, please include email query")

    # return a user slug based from an email query
    user = User.query.filter_by(email=email).first()
    if user is None:
        abort(404, "There's no user with email " + email)

    return json_for_client(user)


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

            url = g.roots["api"] + "/v1/collection/" + user.collection_id
            r = requests.delete(url, params=coll_delete_params)
            print "delete colls and items; " + r.text

            print "deleting user ", user.email
            db.session.delete(user)

        db.session.commit()
        return make_response("deleted {num_users} users.".format(
            num_users=len(retrieved_users)))
    else:
        return make_response("these endpoint only supports deleting for now.")


@app.route("/users/test/collection_ids")
def test_user_cids():
    test_users = User.query.filter(User.surname == "impactstory").all()
    print "test_users: ", test_users
    test_collection_ids = [user.collection_id for user in test_users]
    return json_for_client({"collection_ids": test_collection_ids})


#------------------ user/:userId/products -----------------


@app.route("/user/<int:userId>/products", methods=["GET", "PUT", "DELETE"])
def user_products_view_and_modify(userId):
    retrieved_user = User.query.get(userId)
    if retrieved_user is None:
        abort(404, "That user doesn't exist.")

    if request.method == "GET":
        (profile_collection, status_code) = retrieved_user.get_products()
    elif request.method == "PUT":
        aliases_to_add = request.json.get("aliases")
        (profile_collection, status_code) = retrieved_user.add_products(aliases_to_add)
    elif request.method == "DELETE":
        tiids_to_delete = request.json.get("tiids")
        (profile_collection, status_code) = retrieved_user.delete_products(tiids_to_delete)
    else:
        abort(405)  #method not supported.  Won't get here.

    response_to_send = make_response(profile_collection, status_code)
    return response_to_send




#------------------ user/:userId/password -----------------


@app.route("/user/<email>/password", methods=["GET"])
def get_password_reset_link(email):
    email = unicode(email).lower()
    retrieved_user = User.query.filter_by(email=email).first()
    if retrieved_user is None:
        abort(404, "That user doesn't exist.")

    # make the signed reset token
    s = TimestampSigner(os.getenv("SECRET_KEY"), salt="reset-password")
    reset_token = s.sign(retrieved_user.email)

    base_reset_url = g.roots["webapp_pretty"] + "/change-password"
    full_reset_url = base_reset_url + "/" + reset_token

    # send the email here...
    mailer = mandrill.Mandrill(os.getenv("MANDRILL_APIKEY"))

    text = """Hi! You asked to reset your ImpactStory password. To do that, just
copy and paste the URL below into your browser's address
bar:\n\n{url}\n\n(If you didn't ask to reset your password, you can just ignore
this message).\nBest,\nThe ImpactStory team""".format(url=full_reset_url)

    html = """<p>Hi! You asked to reset your ImpactStory password. To do that, just
<a href="{url}">click this reset link</a>, or copy and paste the URL below into your
browser's address bar:</p><pre>{url}</pre><p>(If you didn't ask to reset your password,
you can just ignore this message.)<br>Best,<br>The ImpactStory
team</p>""".format(url=full_reset_url)

    msg = {
        "text": text,
        "html": html,
        "subject": "Password reset link",
        "from_email": "team@impactstory.org",
        "from_name": "ImpactStory support",
        "to": [{"email":email, "name":"ImpactStory user"}],  # must be a list
        "tags": ["password-resets"],
        "track_opens": False,
        "track_clicks": False
    }
    mailer.messages.send(msg)
    logger.info(u"Sent a password reset email to " + email)

    return json_for_client({"message": "link emailed."})


@app.route("/user/<int:userId>/password", methods=["PUT"])
def user_password_modify(userId):
    retrieved_user = get_user_from_id(userId)

    if  retrieved_user.check_password(request.json["current_password"]):
        retrieved_user.set_password(request.json["new_password"])
        db.session.commit()
        return make_response(json.dumps("ok"), 200)

    else:
        abort(403, "The current password is not correct.")





#------------------ user/:userId/... -----------------


@app.route("/user/<int:userId>", methods=["PUT"])
def user_put(userId):
    """
    Just a shortcut so the edit-in-place plugin can access JSON methods
    """
    method_name = "user_" + request.form["name"] + "_modify"
    return globals()[method_name](userId, request.form["value"])

@app.route("/user/<int:userId>/email")
def user_email_modify(userId, new_email):
    retrieved_user = get_user_from_id(userId)
    if g.user.get_id() != retrieved_user.get_id():
        abort(403, "You must be logged in to change your email.")

    # check for duplicates
    user_with_same_email = User.query.filter(
        func.lower(User.email) == func.lower(new_email)
    ).first()

    if user_with_same_email is None:
        pass
        retrieved_user.email = new_email
    else:
        abort(409, "Someone has already registered this email") # see http://stackoverflow.com/a/3826024/226013

    db.session.commit()
    return make_response(json.dumps(retrieved_user.email), 200)


@app.route("/user/<int:userId>/slug/<new_slug>", methods=["PUT"])
def user_slug_modify(userId, new_slug):

    # check for allowed characters
    has_non_word_chars = re.compile("[^\w'-]", re.U).search(new_slug)
    if has_non_word_chars is not None:
        abort(400, "Character not allowed.")

    # check for user login
    retrieved_user = get_user_from_id(userId)
    if g.user.get_id() != retrieved_user.get_id():
        abort(403, "You must be logged in to change your URL.")

    # check for duplicates
    user_with_same_slug = User.query.filter(
        func.lower(User.url_slug) == func.lower(new_slug)
    ).first()

    if user_with_same_slug is None:
        pass
        retrieved_user.url_slug = new_slug
    else:

        if request.args.get("fail_on_duplicate") in ["true", "yes", 1]:
            abort(409, "this url slug already exists") # see http://stackoverflow.com/a/3826024/226013
        else:
            logger.info(u"tried to mint a url slug ('{slug}') that already exists, so appending number".format(
                slug=retrieved_user.url_slug
            ))
            # to de-duplicate, mint a slug with a random number on it
            retrieved_user.uniqueify_slug()

    db.session.commit()
    return make_response(json.dumps(retrieved_user.url_slug), 200)



def user_name_modify(userId, name, name_type):
    """
    Refactored out stuff that both given and surname edits use.

    :param name_type: surname or given_name
    """

    retrieved_user = get_user_from_id(userId)
    if g.user.get_id() != retrieved_user.get_id():
        abort(403, "You must be logged in to change your name.")

    setattr(retrieved_user, name_type, name)
    db.session.commit()
    return make_response(json.dumps(name), 200)


@app.route("/user/<int:userId>/surname/<name>", methods=["PUT"])
def user_surname_modify(userId, name):
    return user_name_modify(userId, name, "surname")


@app.route("/user/<int:userId>/given_name/<name>", methods=["PUT"])
def user_given_name_modify(userId, name):
    return user_name_modify(userId, name, "given_name")






###############################################################################
#
#   MOSTLY-STATIC PAGES
#
###############################################################################


# static pages
@app.route('/')
def index():
    return render_template_custom('index.html')


@app.route('/about')
def about(): 
    return render_template_custom('about.html')



@app.route('/faq')
def faq(): 
    # get the table of items and identifiers
    which_items_loc = os.path.join(
        os.path.dirname(__file__),
        "static",
        "whichartifacts.html"
        )
    which_item_types = open(which_items_loc).read()

    # get the static_meta info for each metric
    try:
        url = "{api_root}/provider".format(
            api_root=g.roots["api"])        
        r = requests.get(url)
        metadata = json.loads(r.text)
    except requests.ConnectionError:
        metadata = {}
    
    return render_template_custom(
        'faq.html',
        which_artifacts=which_item_types,
        provider_metadata=metadata
        )


@app.route('/api-docs')
def apidocs(): 
    return render_template_custom('api-docs.html')


@app.route("/loading.gif")
def images():
    path = "static/img/loading-small.gif"
    return send_file(path)



###############################################################################
#
#   ITEM- AND COLLECTION-LEVEL STUFF
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


@app.route('/collection/<collection_id>')
def collection_report(collection_id):
    url = "{api_root}/v1/collection/{collection_id}?key={api_key}&include_items=0".format(
        api_root=g.roots["api"],
        api_key=g.api_key,
        collection_id=collection_id
    )
    
    r = requests.get(url)
    flash("You're looking at an old-style collection page. Check out our new <a href='http://blog.impactstory.org/2013/06/17/impact-profiles/'>profile pages!</a>", "alert")
    if r.status_code == 200:
        collection = json.loads(r.text)
        return render_template_custom(
            'collection.html',
            page_title=collection["title"],
            report_id=collection["_id"],
            report_id_namespace="impactstory_collection_id",
            api_query="collection/" + collection["_id"]
        )
    else:
        abort(404, "This collection doesn't seem to exist yet. " + url)


@app.route('/item/<ns>/<path:id>')
def item_report(ns, id):
    url = "{api_root}/v1/item/{ns}/{id}?key={api_key}".format(
        api_root=g.roots["api"],
        ns=ns,
        id=id,
        api_key=os.environ["API_KEY"]
    )
    r = requests.get(url)
    return render_template_custom(
        'item.html',
        page_title="",
        report_id=id,
        report_id_namespace=ns,
        api_query="item/{ns}/{id}".format(ns=ns, id=id)
    )

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





###############################################################################
#
#   ADMIN AND UTILITY FUNCTIONS
#
###############################################################################

@app.route('/admin/key')
def generate_api_key():
    return render_template_custom('generate-api.html')

@app.route('/wospicker', methods=["GET"])
def wospicker():
    num_total = int(request.args.get("total"))
    num_subset = int(request.args.get("subset"))

    pages_and_ids = util.pickWosItems(num_total, num_subset)

    resp = make_response(json.dumps(pages_and_ids, indent=4), 200)
    resp.mimetype = "application/json"
    return resp

try:
    # see http://support.blitz.io/discussions/problems/363-authorization-error
    @app.route('/mu-' + os.environ["BLITZ_API_KEY"], methods=["GET"])
    def blitz_validation():
        resp = make_response("42", 200)
        return resp
except KeyError:
    logger.error(u"BLITZ_API_KEY environment variable not defined, not setting up validation api endpoint")


@app.route('/hirefire/test', methods=["GET"])
def hirefire_test():
    resp = make_response("HireFire", 200)
    resp.mimetype = "text/html"
    return resp

try:
    @app.route('/hirefire/' + os.environ["HIREFIRE_TOKEN"] + '/info', methods=["GET"])
    def hirefire_worker_count():
        import time
        resp = make_response(json.dumps([{"worker":1}]), 200)
        resp.mimetype = "application:json"
        return resp
except KeyError:
    logger.error(u"HIREFIRE_TOKEN environment variable not defined, not setting up validation api endpoint")


@app.route('/hirefireapp/test', methods=["GET"])
def hirefireapp_test():
    resp = make_response("HireFire", 200)
    resp.mimetype = "text/html"
    return resp

try:
    @app.route('/hirefireapp/' + os.environ["HIREFIREAPP_TOKEN"] + '/info', methods=["GET"])
    def hirefireapp_worker_count():
        resp = make_response(json.dumps({"worker":1}), 200)
        resp.mimetype = "application:json"
        return resp
except KeyError:
    logger.error(u"HIREFIREAPP_TOKEN environment variable not defined, not setting up validation api endpoint")




@app.route('/logo')
def logo():
    filename = "static/img/logos/impactstory-logo-big.png"
    return send_file(filename, mimetype='image/png')



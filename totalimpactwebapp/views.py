import requests, os, json, logging, shortuuid, re, random

from flask import request, send_file, abort, make_response, g, redirect, url_for
from flask import render_template, session
from flask.ext.assets import Environment, Bundle
from flask.ext.login import login_user, logout_user, current_user, login_required

from sqlalchemy.exc import IntegrityError, InvalidRequestError


from totalimpactwebapp import app, util, db, login_manager, forms
from totalimpactwebapp.user import User

logger = logging.getLogger("tiwebapp.views")

assets = Environment(app)
js = Bundle('js/bootstrap.js',
            'js/bootstrapx-clickover.js',
            'js/prettify.js',
            'js/underscore.js',
            'js/hmac-sha1.js',
            'js/jquery.placeholder.js',
            'js/jquery.headerlinks.js',
            'js/jquery.color.js',
            'js/jquery.cookie.js',
            'js/icanhaz.js',
            'js/browser-fixes.js', # don't need any more, use underscore.js
            'js/ti-item.js',
            'js/ti-user.js',
            'js/ti-aliaslist.js',
            'js/ti-coll.js',
            'js/ti-ui.js',
            'js/google-analytics.js',
            'js/mixpanel.js',
            filters="yui_js",
            output='js/packed.js'
)

css = Bundle('css/bootstrap.css',
            'css/prettify.css',
            'css/jasny-bootstrap.css',
            'css/main.css',
            'css/create-collection.css',
            'css/report.css',
            filters="yui_css",
            output="css/packed.css"
)

js_widget = Bundle(
            'js/icanhaz.js',
            'js/bootstrap-tooltip-and-popover.js',
            'js/underscore.js',
            # 'js/mixpanel.js',
            'js/ti-item.js',
            filters="yui_js",
            output="js/widget.js",
)
assets.register('js_widget', js_widget)
assets.register('js_all', js)
assets.register('css_all', css)



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

    # get rid of private attributes in the dict
    obj_dict = {}
    for k, v in temp.iteritems():
        if k[0] != "_":
            obj_dict[k] = v

    resp = make_response(json.dumps(obj_dict, sort_keys=True, indent=4), 200)
    resp.mimetype = "application/json"
    return resp



@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.before_first_request
def setup_db_tables():
    logger.info("first request; setting up db tables.")
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
    g.mixpanel_token = os.getenv("MIXPANEL_TOKEN")
    g.api_key = os.getenv("API_KEY")


@app.before_request
def log_ip_address():
    if request.endpoint != "static":
        ip_address = request.remote_addr
        logger.info("%30s IP address calling %s %s" % (ip_address, request.method, request.url))

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
#   USER-RELATED VIEWS
#
###############################################################################


@app.route("/<path:dummy>")  # from http://stackoverflow.com/a/14023930/226013
def redirect_to_profile(dummy):
    """
    Route things that look like user profile urls.

    *Everything* not explicitly routed to another function will end up here.
    """
    return user_profile(dummy)


def user_profile(url_slug):

    profile = User.query.filter_by(url_slug=url_slug).first()
    if profile is None:
        abort(404)
    else:
        # for now render something quite like the report template. change later.

        return render_template(
            'user-profile.html',
            request_url=request.url,
            profile=profile,
            report_id=profile.collection_id,
            report_id_namespace="impactstory_collection_id",
            api_query=profile.collection_id
        )

@app.route("/<url_slug>/preferences")
def user_prefs(url_slug):

    if not g.user.is_authenticated():
        return redirect(url_for('login', next=request.url))

    if g.user.url_slug != url_slug:
        return redirect("/" + url_slug)

    profile = User.query.filter_by(url_slug=url_slug).first()
    if profile is None:
        abort(404)
    else:
        return render_template(
            'user-prefs.html',
            profile=profile
        )


@app.route("/login", methods=["GET", "POST"])
def login():

    logger.debug("user trying to log in.")

    if g.user is not None and g.user.is_authenticated():
            return redirect("/" + g.user.url_slug)

    errors = {"email": False, "password": False}
    if request.method == 'POST':
        email = request.form['email']
        g.user = User.query.filter_by(email=email).first()

        if g.user is None:
            errors["email"] = True
        elif not g.user.check_password(request.form["password"]):
            errors["password"] = True
        else:
            # Yay, no errors! Log the user in and redirect.
            login_user(g.user)
            return redirect("/" + g.user.url_slug)


    # the code below this is executed if the request method
    # was GET or the credentials were invalid
    return render_template(
        'login.html',
        errors=errors
    )


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))


@app.route("/user", methods=["POST"])
def user_create():
    """create a user"""
    logger.debug("POST /user: Creating new user")

    alias_tiids = request.json["alias_tiids"]
    url = "http://" + g.roots["api"] + "/collection"
    data = {"aliases": alias_tiids, "title": request.json["email"]}
    headers = {'Content-type': 'application/json', 'Accept': 'application/json'}
    r = requests.post(url, data=json.dumps(data), headers=headers)
    logger.debug("POST /user: created collection " + r.json["collection"]["_id"])

    user = User(
        email=request.json["email"],
        password=request.json["password"],
        collection_id=r.json["collection"]["_id"],
        given_name=request.json["given_name"],
        surname=request.json["surname"]
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError as e:
        logger.info(e)
        logger.info("tried to mint a url slug ('{slug}') that already exists".format(
            slug=user.url_slug
        ))
        db.session.rollback()
        # to de-duplicate, mint a slug with a random number on it
        user.url_slug = user.url_slug + str(random.randint(1000,9999))
        db.session.add(user)
        db.session.commit()

    logger.debug("POST /user: Finished creating user {id}, {slug}".format(
        id=user.id,
        slug=user.url_slug
    ))

    login_user(user)
    return json_for_client({"url_slug": user.url_slug})

@app.route("/user", methods=["GET"])
def user_view():
    email = request.args["email"]
    if email is None:
        abort(400, "Bad request, please include email query")

    # return a user slug based from an email query
    user = User.query.filter_by(email=email).first()
    if user is None:
        abort(404, "There's no user with email " + email)
    return json_for_client(user)

@app.route("/user/<int:userId>/slug", methods=["GET", "PUT"])
def user_slug_view_and_modify(userId):
    retrieved_user = User.query.get(userId)
    if retrieved_user is None:
        abort(404, "That user doesn't exist.")

    if request.method == "PUT":
        # test from the command line like this 
        # curl -i -H "Content-Type: application/json" -X PUT -d '{"slug":"ClarkKent"}' http://localhost:5000/user/2/slug
        retrieved_user.url_slug = request.json["slug"]
        try:
            db.session.commit()
        except (IntegrityError, InvalidRequestError) as e:
            db.session.rollback()
            logger.info("tried to mint a url slug ('{slug}') that already exists, so appending number".format(
                slug=retrieved_user.url_slug
            ))
            # to de-duplicate, mint a slug with a random number on it
            retrieved_user.url_slug = request.json["slug"] + str(random.randint(1000,9999))
            db.session.commit()
    else:
        # test like this
        # curl -i http://localhost:5000/user/2/slug
        slug = retrieved_user.url_slug

    return make_response(json.dumps(retrieved_user.url_slug), 200)


@app.route("/user/<int:userId>/name", methods=["GET", "PUT"])
def user_name_view_and_modify(userId):
    retrieved_user = User.query.get(userId)
    if retrieved_user is None:
        abort(404, "That user doesn't exist.")

    if request.method == "PUT":
        # test from the command line like this 
        # curl -i -H "Content-Type: application/json" -X PUT -d '{"given":"Clark", "surname":"Kent"}' http://localhost:5000/user/2/name
        json_name = request.json
        retrieved_user.given_name = json_name["given"]
        retrieved_user.surname = json_name["surname"]
        db.session.commit()
    else:
        # test like this
        # curl -i http://localhost:5000/user/2/name
        json_name = {"given": retrieved_user.given_name, "surname": retrieved_user.surname}

    return make_response(json.dumps(json_name), 200)


@app.route("/user/<int:userId>/password", methods=["PUT"])
def user_password_modify(userId):
    retrieved_user = User.query.get(userId)
    if retrieved_user is None:
        abort(404, "That user doesn't exist.")

    # test from the command line like this 
    # curl -i -H "Content-Type: application/json" -X PUT -d '{"password":"opensesame"}' http://localhost:5000/user/2/password
    retrieved_user.set_password(request.json["password"])
    db.session.commit()
    return make_response(json.dumps("ok"), 200)


@app.route("/user/<username>")
def user_page_from_user_endpoint(username):
    return redirect("/username")

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

@app.route('/create', methods=["GET"])
def collection_create():
    return render_template('create-collection.html')





###############################################################################
#
#   MOSTLY-STATIC PAGES
#
###############################################################################


# static pages
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/about')
def about(): 
    return render_template('about.html')


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
        r = requests.get('http://' + g.roots["api"] +'/provider')
        metadata = json.loads(r.text)
    except requests.ConnectionError:
        metadata = {}
    
    return render_template(
        'faq.html',
        which_artifacts=which_item_types,
        provider_metadata=metadata
        )


@app.route('/api-docs')
def apidocs(): 
    return render_template('api-docs.html')






###############################################################################
#
#   ITEM- AND COLLECTION-LEVEL STUFF
#
###############################################################################


@app.route("/embed/test/widget")
def embed_test_widget():
    return render_template("test-pages/sample-embed-internal-test.html")


@app.route("/embed/impactstory.js")
@app.route("/embed/v1/impactstory.js")
def impactstory_dot_js():

    badges_template = render_template("js-template-badges.html") \
        .replace("\n", "") \
        .replace("'", "&apos;")

    # First build the concatenated js file for the widget. Building makes a file.
    # Then open the file and put it in the template to return.
    js_widget.build() # always build this, whether dev in dev env or not
    libs = open(os.path.dirname(__file__) + "/static/js/widget.js", "r").read()

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
    url = "http://{api_root}/v1/collection/{collection_id}?key={api_key}&include_items=0".format(
        api_root=g.roots["api"],
        api_key=g.api_key,
        collection_id=collection_id
    )
    
    r = requests.get(url)
    if r.status_code == 200:
        collection = json.loads(r.text)
        return render_template(
            'report.html',
            request_url=request.url,
            page_title=collection["title"],
            report_id=collection["_id"],
            report_id_namespace="impactstory_collection_id",
            api_query="collection/" + collection["_id"]
        )
    else:
        abort(404, "This collection doesn't seem to exist yet. " + url)


@app.route('/item/<ns>/<path:id>')
def item_report(ns, id):
    url = "http://{api_root}/v1/item/{ns}/{id}?key={api_key}".format(
        api_root=g.roots["api"],
        ns=ns,
        id=id,
        api_key=os.environ["API_KEY"]
    )
    r = requests.get(url)
    return render_template(
        'report.html',
        request_url=request.url,
        page_title="",
        report_id=id,
        report_id_namespace=ns,
        api_query="item/{ns}/{id}".format(ns=ns, id=id)
    )







###############################################################################
#
#   ADMIN AND UTILITY FUNCTIONS
#
###############################################################################

@app.route('/admin/key')
def generate_api_key():
    return render_template('generate-api.html')

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
    logger.error("BLITZ_API_KEY environment variable not defined, not setting up validation api endpoint")


@app.route('/hirefire/test', methods=["GET"])
def hirefire_test():
    resp = make_response("HireFire", 200)
    resp.mimetype = "text/html"
    return resp

try:
    @app.route('/hirefire/' + os.environ["HIREFIRE_TOKEN"] + '/info', methods=["GET"])
    def hirefire_worker_count():
        import time
        time.sleep(3)

        resp = make_response(json.dumps([{"worker":1}]), 200)
        resp.mimetype = "application:json"
        return resp
except KeyError:
    logger.error("HIREFIRE_TOKEN environment variable not defined, not setting up validation api endpoint")


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
    logger.error("HIREFIREAPP_TOKEN environment variable not defined, not setting up validation api endpoint")


@app.route('/logo')
def logo():
    filename = "static/img/logos/impactstory-logo-big.png"
    return send_file(filename, mimetype='image/png')

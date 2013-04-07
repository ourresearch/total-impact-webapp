import requests, os, json, jsonpickle, logging, shortuuid

from flask import request, send_file, abort, make_response, redirect, url_for
from flask import render_template, session
from flask.ext.assets import Environment, Bundle
from flask.ext.login import LoginManager
from sqlalchemy.exc import IntegrityError


from totalimpactwebapp import app, util, db
from totalimpactwebapp.models import User

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



roots = {
    "api": os.getenv("API_ROOT"),
    "api_pretty": os.getenv("API_ROOT_PRETTY", os.getenv("API_ROOT")),
    "webapp": os.getenv("WEBAPP_ROOT"),
    "webapp_pretty": os.getenv("WEBAPP_ROOT_PRETTY", os.getenv("WEBAPP_ROOT"))
}


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


@app.before_request
def log_ip_address():
    if request.endpoint != "static":
        ip_address = request.remote_addr
        logger.info("%30s IP address calling %s %s" % (ip_address, request.method, request.url))

@app.after_request
def add_crossdomain_header(resp):
    resp.headers['Access-Control-Allow-Origin'] = "*"
    resp.headers['Access-Control-Allow-Methods'] = "POST, GET, OPTIONS, PUT, DELETE"
    resp.headers['Access-Control-Allow-Headers'] = "Content-Type"

    return resp


# static pages
@app.route('/')
def home():
    return render_template(
    'index.html', 
    page_title="tell the full story of your research impact",
    body_class="homepage",
    mixpanel_token=os.environ["MIXPANEL_TOKEN"],
    roots=roots,
    api_key=os.environ["API_KEY"]        
    )


@app.route("/embed/impactstory.js")
@app.route("/embed/v1/impactstory.js")
def impactstory_dot_js():

    badges_template = render_template("js-template-badges.html")\
        .replace("\n", "")\
        .replace("'", "&apos;")

    # First build the concatenated js file for the widget. Building makes a file.
    # Then open the file and put it in the template to return.
    js_widget.build() # always build this, whether dev in dev env or not
    libs = open(os.path.dirname(__file__) + "/static/js/widget.js", "r").read()

    rendered = render_template(
        "embed/impactstory.js",
        badges_template=badges_template,
        libs=unicode(libs, "utf-8"),
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],
        api_root=os.environ["API_ROOT"],
        api_key=os.environ["API_KEY"],
        webapp_root=os.environ["WEBAPP_ROOT"],
        roots=roots
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


@app.route("/user", methods=["GET", "POST"])
def user_view(append_to_slug=""):
    """
    Create and modify users
    """

    if request.method == "POST":
        logger.debug("POST /user: Creating new user")

        alias_tiids = request.json["alias_tiids"]
        url = "http://" + roots["api"] + "/collection"
        data = {"aliases": alias_tiids, "title": request.json["email"]}
        headers = {'Content-type': 'application/json', 'Accept': 'application/json'}
        r = requests.post(url, data=json.dumps(data), headers=headers)
        logger.debug("POST /user: created collection " + r.json["collection"]["_id"])

        user = User(
            email=request.json["email"],
            collection_id=r.json["collection"]["_id"],
            given_name=request.json["given_name"],
            surname=request.json["surname"]
        )
        user.url_slug += append_to_slug  # hack for when slugs collide
        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError as e:
            logger.info(e)
            logger.info("tried to mint a url slug ('{slug}') that already exists".format(
                slug=user.url_slug
            ))
            db.session.rollback()
            return user_view(append_to_slug="-" + shortuuid.uuid()[0:5])

        logger.debug("POST /user: Finished creating user {id}, {slug}".format(
            id=user.id,
            slug=user.url_slug
        ))

        return json_for_client({"url_slug": user.url_slug})

    elif request.method == "GET":
        email = request.args["email"]
        if email is not None:
            # return a user slug based from an email query
            user = User.query.filter_by(email=email).first()
            if user is None:
                abort(404, "There's no user with email " + email)
            else:
                return json_for_client(user)







@app.route("/embed/test/widget")
def embed_test_widget():

    return render_template(
        "test-pages/sample-embed-internal-test.html",
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],        
        roots=roots,
        api_key=os.environ["API_KEY"]
    )

@app.route("/embed/test/coll")
def embed_test_coll():

    return render_template(
        "test-pages/sample-coll-embed.html",
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],
        roots=roots,
        api_key=os.environ["API_KEY"]
    )


@app.route('/about')
def about(): 
    return render_template(
        'about.html',
        page_title="about",
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        roots=roots,
        api_key=os.environ["API_KEY"]        
        )

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
        r = requests.get('http://' + roots["api"] +'/provider')
        metadata = json.loads(r.text)
    except requests.ConnectionError:
        metadata = {}
    
    return render_template(
        'faq.html',
        page_title="faq",
        which_artifacts=which_item_types,
        provider_metadata=metadata,
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],
        roots=roots
        )

@app.route('/api-docs')
def apidocs(): 
    return render_template(
        'api-docs.html',
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        api_root=os.environ["API_ROOT"],
        api_key=os.environ["API_KEY"],        
        roots=roots,
        page_title="api & widget"
        )

@app.route('/pricing')
def pricing():
    return render_template(
        'pricing.html',
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],
        roots=roots,
        api_key=os.environ["API_KEY"],        
        page_title="pricing"
        )



@app.route('/create', methods=["GET"])
def collection_create():
    return render_template(
        'create-collection.html',
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],
        roots=roots,
        api_key=os.environ["API_KEY"],
        page_title="create collection",
        body_class="create-collection"
    )


@app.route("/<path:dummy>")  # from http://stackoverflow.com/a/14023930/226013
def redirect_to_profile(dummy):
    """
    Route things that look like user profile urls.

    *Everything* not explicitly routed to another function will end up here.
    """

    return user_profile(dummy)


def user_profile(url_slug):

    user = User.query.filter_by(url_slug=url_slug).first()
    if user is None:
        abort(404)
    else:
        # for now render something quite like the report template. change later.

        return render_template(
            'user-profile.html',
            mixpanel_token=os.environ["MIXPANEL_TOKEN"],
            roots=roots,
            api_key=os.environ["API_KEY"],
            request_url=request.url,
            page_title=user.full_name,
            body_class="report",
            report_id=user.collection_id,
            report_id_namespace="impactstory_collection_id",
            api_query=user.collection_id
        )


@app.route('/collection/<collection_id>')
def collection_report(collection_id):
    url = "http://{api_root}/v1/collection/{collection_id}?key={api_key}&include_items=0".format(
        api_root=roots["api"],
        api_key=os.environ["API_KEY"],        
        collection_id=collection_id
    )
    
    r = requests.get(url)
    if r.status_code == 200:
        collection = json.loads(r.text)
        return render_template(
            'report.html',
            mixpanel_token=os.environ["MIXPANEL_TOKEN"],
            roots=roots,
            api_key=os.environ["API_KEY"],
            request_url=request.url,
            page_title=collection["title"],
            body_class="report",
            report_id=collection["_id"],
            report_id_namespace="impactstory_collection_id",
            api_query="collection/"+collection["_id"]
        )
    else:
        abort(404, "This collection doesn't seem to exist yet. "+url)


@app.route('/item/<ns>/<path:id>')
def item_report(ns, id):
    url = "http://{api_root}/v1/item/{ns}/{id}?key={api_key}".format(
        api_root=roots["api"],
        ns=ns,
        id=id,
        api_key=os.environ["API_KEY"]
    )
    r = requests.get(url)
    return render_template(
        'report.html',
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],
        roots=roots,
        api_key=os.environ["API_KEY"],
        request_url=request.url,
        page_title="",
        body_class="report",
        report_id=id,
        report_id_namespace=ns,
        api_query="item/{ns}/{id}".format(ns=ns, id=id)
    )


@app.route('/admin/key')
def generate_api_key():
    return render_template(
        'generate-api.html', 
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        roots=roots,
        api_key=os.environ["API_KEY"],
        page_title="generate api key",
        body_class="create-collection"
        )

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

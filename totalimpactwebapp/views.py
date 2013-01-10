import requests, iso8601, os, json, logging
import urllib2
import base64
import time
import urlparse

from flask import request, redirect, abort, make_response
from flask import render_template
from flask.ext.assets import Environment, Bundle

from totalimpactwebapp import app, util

logger = logging.getLogger("tiwebapp.views")

assets = Environment(app)
js = Bundle('js/bootstrap.js',
            'js/bootstrapx-clickover.js',
            'js/prettify.js',
            'js/underscore.js',
            'js/hmac-sha1.js',
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

js_widget = Bundle('js/icanhaz.js',
                   'js/bootstrap-tooltip-and-popover.js',
                   'js/underscore.js',
                   'js/ti-item.js',
                   filters="yui_js",
                   output="js/widget.js",
)
assets.register('js_widget', js_widget)
assets.register('js_all', js)
assets.register('css_all', css)





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
    api_root=os.environ["API_ROOT"],
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
        "impactstory.js",
        badges_template=badges_template,
        libs=unicode(libs, "utf-8"),
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],
        api_root=os.environ["API_ROOT"],
        api_key=os.environ["API_KEY"],
        webapp_root=os.environ["WEBAPP_ROOT"]
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

@app.route("/embed/test")
def embed_test():
    return render_template(
        "sample-embed-internal-test.html",
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],        
        webapp_root = os.environ["WEBAPP_ROOT"],
        api_root=os.environ["API_ROOT"],
        api_key=os.environ["API_KEY"]        
    )


@app.route('/about')
def about(): 
    return render_template(
        'about.html',
        page_title="about",
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        api_root=os.environ["API_ROOT"],
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
        r = requests.get("http://" + os.environ["API_ROOT"] +'/provider')
        metadata = json.loads(r.text)
    except requests.ConnectionError:
        metadata = {}
    
    return render_template(
        'faq.html',
        page_title="faq",
        which_artifacts=which_item_types,
        provider_metadata=metadata,
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        api_root=os.environ["API_ROOT"],
        api_key=os.environ["API_KEY"]        
        )

@app.route('/api-docs')
def apidocs(): 
    return render_template(
        'api-docs.html',
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        api_root=os.environ["API_ROOT"],
        api_key=os.environ["API_KEY"],        
        webapp_root = os.environ["WEBAPP_ROOT"],
        page_title="api & widget"
        )

@app.route('/pricing')
def pricing():
    return render_template(
        'pricing.html',
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],
        api_root=os.environ["API_ROOT"],
        api_key=os.environ["API_KEY"],        
        webapp_root = os.environ["WEBAPP_ROOT"],
        page_title="pricing"
        )



@app.route('/create')
def collection_create():
    return render_template(
        'create-collection.html', 
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        api_root=os.environ["API_ROOT"],
        api_key=os.environ["API_KEY"],        
        page_title="create collection",
        body_class="create-collection"
        )

@app.route('/collection/<collection_id>')
def collection_report(collection_id):
    url = "http://{api_root}/v1/collection/{collection_id}?key={api_key}&include_items=0".format(
        api_root=os.getenv("API_ROOT"),
        api_key=os.environ["API_KEY"],        
        collection_id=collection_id
    )
    
    r = requests.get(url)
    if r.status_code == 200:
        collection = json.loads(r.text)
        return render_template(
            'report.html',
            mixpanel_token=os.environ["MIXPANEL_TOKEN"],                    
            api_root=os.environ["API_ROOT"],
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
        api_root=os.getenv("API_ROOT"),
        ns=ns,
        id=id,
        api_key=os.environ["API_KEY"]
    )
    r = requests.get(url)
    return render_template(
        'report.html',
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],        
        api_root=os.environ["API_ROOT"],
        api_key=os.environ["API_KEY"],
        request_url=request.url,
        page_title="",
        body_class="report",
        report_id=id,
        report_id_namespace=ns,
        api_query="item/{ns}/{id}".format(ns=ns, id=id)
    )


@app.route('/vitals', methods=["POST"])
def vitals():
    """
    Logs reporting stats from the embed code to mixpanel

    Gets a "vitals" object that has a url and a list of "params" objects.
    Each widget on a page sends its own params object; in practice, these will
    almost certainly be identical since users aren't likely to set different
    options for widgets on the same page. It's a good way to count widgets on
    that page, though.

    For documentation on the keys in the the params object, see the default
    params listed at the head of impactstory.js's main() function, and also the
    api-docs page.
    """

    vitals = request.json
    try:
        referring_domain = urlparse.urlsplit(request.referrer).netloc
    except AttributeError:
        referring_domain = "";

    properties = {  
                    'token': os.getenv("MIXPANEL_TOKEN"), 
                    'time': int(time.time()),
                    'ip': request.remote_addr,
                    "$referring_domain": referring_domain,
                    "$referrer" : request.referrer,
                    "$os": request.user_agent.platform,
                    "$browser": request.user_agent.browser
                }

    try:
        properties["Embeds per page"] = len(vitals["allParams"])
        properties["Host page"] = vitals["url"]
        properties["API Key"] = vitals["allParams"][0]["api-key"]
        for embed_param in vitals["allParams"][0]:
            properties["Embed:"+embed_param] = vitals["allParams"][0][embed_param]                   
    except IndexError, KeyError:
        logger.info("Errors enumerating vitals params for {vitals}".format(
            vitals=vitals))
    
    mixpanel_params = {"event": "Impression:embed", "properties": properties}
    mixpanel_data = base64.b64encode(json.dumps(mixpanel_params))
    mixpanel_resp = urllib2.urlopen("http://api.mixpanel.com/track/?data=%s" % mixpanel_data)

    logger.debug("Successful vitals mixpanel report")

    resp = make_response("duly noted. carry on.", 200)
    return resp

@app.route('/admin/key')
def generate_api_key():
    return render_template(
        'generate-api.html', 
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        api_root=os.environ["API_ROOT"],
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


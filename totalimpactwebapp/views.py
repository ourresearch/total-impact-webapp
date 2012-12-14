import requests, iso8601, os, json, logging

from flask import Flask, jsonify, json, request, redirect, abort, make_response
from flask import render_template, flash
from libsaas.services import mixpanel

from totalimpactwebapp import app, util
from totalimpactwebapp.models import Github
from totalimpactwebapp import pretty_date

logger = logging.getLogger("tiwebapp.views")
mymixpanel = mixpanel.Mixpanel(token=os.getenv("MIXPANEL_TOKEN"))


@app.before_request
def log_ip_address():
    if request.endpoint != "static":
        ip_address = request.remote_addr
        logger.info("%30s IP address calling %s %s" % (ip_address, request.method, request.url))

# static pages
@app.route('/')
def home():
    return render_template(
    'index.html', 
    page_title="tell the full story of your research impact",
    body_class="homepage",
    mixpanel_token=os.environ["MIXPANEL_TOKEN"],
    api_root=os.environ["API_ROOT"]
    )


@app.route("/embed/impactstory.js")
@app.route("/embed/v1/impactstory.js")
def impactstory_dot_js():

    badges_template = render_template("js-template-badges.html").replace("\n", "")
    ich_def = open(os.path.dirname(__file__) + "/static/js/icanhaz.min.js", "r").read()
    ti_item_def = open(os.path.dirname(__file__) + "/static/js/ti-item.js", "r").read()

    rendered = render_template(
        "impactstory.js",
        ich=ich_def,
        ti_item=ti_item_def,
        badges_template=badges_template,
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],        
        api_root=os.environ["API_ROOT"],
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
        webapp_root = os.environ["WEBAPP_ROOT"]
    )


@app.route('/about')
def about(): 
    return render_template(
        'about.html',
        page_title="about",
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        api_root=os.environ["API_ROOT"]
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
        api_root=os.environ["API_ROOT"]
        )

@app.route('/api-docs')
def apidocs(): 
    return render_template(
        'api-docs.html',
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        api_root=os.environ["API_ROOT"],
        webapp_root = os.environ["WEBAPP_ROOT"],
        page_title="api & embed code"
        )

@app.route('/create')
def collection_create():
    return render_template(
        'create-collection.html', 
        mixpanel_token=os.environ["MIXPANEL_TOKEN"],                
        api_root=os.environ["API_ROOT"],
        page_title="create collection",
        body_class="create-collection"
        )

@app.route('/collection/<collection_id>')
def collection_report(collection_id):
    url = "http://{api_root}/collection/{collection_id}?include_items=0".format(
        api_root=os.getenv("API_ROOT"),
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
    if r.status_code <= 210: # allow unfinished items
        item = json.loads(r.text)
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
    else:
        abort(404, "This item doesn't seem to exist yet. "+url)

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

    logger.debug(json.dumps(vitals))
#    embeds_per_page = len(vitals["allParams"])
#    # heather does awesome things with the vitals and mixpanel here.
#    logger.info("Got vitals message with embeds_per_page={embeds_per_page}".format(
#        embeds_per_page=embeds_per_page))
#    logger.debug("Vitals = {vitals}".format(
#        vitals=vitals))
#
#    mymixpanel.track("Impression:embed", properties={
#        "Host page": vitals["url"],
#        "API Key": vitals["allParams"][0]["api-key"],
#        "Embeds per page": embeds_per_page}, ip=False)

    resp = make_response("duly noted. carry on.", 200)
    # let js clients get this from the browser, regardless of their domain origin.
    resp.headers['Access-Control-Allow-Origin'] = "*"
    resp.headers['Access-Control-Allow-Methods'] = "POST, GET, OPTIONS, PUT, DELETE"
    resp.headers['Access-Control-Allow-Headers'] = "Content-Type"
    return resp



@app.route('/wospicker', methods=["GET"])
def wospicker():
    num_total = int(request.args.get("total"))
    num_subset = int(request.args.get("subset"))

    pages_and_ids = util.pickWosItems(num_total, num_subset)

    resp = make_response(json.dumps(pages_and_ids, indent=4), 200)
    resp.mimetype = "application/json"
    return resp


import requests, iso8601, os, json, logging

from flask import Flask, jsonify, json, request, redirect, abort, make_response
from flask import render_template, flash

from totalimpactwebapp import app, util
from totalimpactwebapp.models import Github
from totalimpactwebapp import pretty_date

logger = logging.getLogger("tiwebapp.views")
    
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
    api_root=os.environ["API_ROOT"]
    )

@app.route('/embed/templates/badges.html')
def badges_templates():
    resp = make_response(render_template("js-template-badges.html"))

    # let js clients get this from the browser, regardless of their domain origin.
    resp.headers['Access-Control-Allow-Origin'] = "*"
    resp.headers['Access-Control-Allow-Methods'] = "POST, GET, OPTIONS, PUT, DELETE"
    resp.headers['Access-Control-Allow-Headers'] = "Content-Type"
    return resp

@app.route("/embed/impactstory.js")
def impactstory_dot_js():
    return render_template(
        "impactstory.js",
        api_root = os.environ["API_ROOT"],
        webapp_root = os.environ["WEBAPP_ROOT"],

    )

@app.route("/embed/test")
def embed_test():
    return render_template(
        "sample-embed.html",
        webapp_root = os.environ["WEBAPP_ROOT"]

    )


@app.route('/about')
def about(): 
    return render_template(
        'about.html',
        page_title="about",
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
        api_root=os.environ["API_ROOT"]
        )

@app.route('/api-docs')
def apidocs(): 
    return render_template(
        'api-docs.html',
        api_root=os.environ["API_ROOT"],
        webapp_root = os.environ["WEBAPP_ROOT"],
        page_title="api & embed code"
        )

@app.route('/create')
def collection_create():
    return render_template(
        'create-collection.html', 
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
            api_root=os.environ["API_ROOT"],
            api_key=os.environ["API_KEY"],
            request_url=request.url,
            page_title=collection["title"],
            body_class="report",
            report_id=collection["_id"],
            report_type="collection"
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
            api_root=os.environ["API_ROOT"],
            api_key=os.environ["API_KEY"],
            request_url=request.url,
            page_title="",
            body_class="report",
            report_id="{ns}/{id}".format(ns=ns, id=id),
            report_type="item"
        )
    else:
        abort(404, "This item doesn't seem to exist yet. "+url)


@app.route('/wospicker', methods=["GET"])
def wospicker():
    num_total = int(request.args.get("total"))
    num_subset = int(request.args.get("subset"))

    pages_and_ids = util.pickWosItems(num_total, num_subset)

    resp = make_response(json.dumps(pages_and_ids, indent=4), 200)
    resp.mimetype = "application/json"
    return resp

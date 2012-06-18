import requests, iso8601, os, json, logging

from flask import Flask, jsonify, json, request, redirect, abort, make_response
from flask import render_template, flash

from totalimpactwebapp import app
from totalimpactwebapp.models import Github
from totalimpactwebapp import pretty_date

logger = logging.getLogger("tiwebapp.views")
    
# static pages
@app.route('/')
def home():
    return render_template(
    'index.html', 
    page_title="uncover the invisible impact of research",
    body_class="homepage")

@app.route('/about')
def about(): 
    return render_template(
        'about.html',
        page_title="about"
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
        r = requests.get('http://total-impact-core.herokuapp.com/provider')
        metadata = json.loads(r.text)
    except requests.ConnectionError:
        metadata = {}
    
    return render_template(
        'faq.html',
        page_title="faq",
        which_artifacts=which_item_types,
        provider_metadata=metadata
        )

@app.route('/api-docs')
def apidocs(): 
    return render_template(
        'api-docs.html',
        page_title="api"
        )

@app.route('/collection/create')
def collection_create():
    return render_template(
        'create-collection.html', 
        page_title="create collection",
        body_class="create-collection"
        )

@app.route('/collection/<collection_id>')
def collection_report(collection_id):
    #r = requests.get("http://" + os.environ["API_ROOT"] +'/collection/' + collection_id)
    r = requests.get("http://total-impact-core.herokuapp.com/collection/" + collection_id)    
    if r.status_code == 200:
        collection = json.loads(r.text)
        return render_template(
            'collection.html',
            page_title=collection["title"],
            collection=collection
        )
    else:
        abort(404, "This collection doesn't seem to exist yet.")


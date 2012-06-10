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
    return render_template('index.html')

@app.route('/about')
def about(): 

    # get the table of artifacts and identifiers
    which_artifacts_loc = os.path.join(
        os.path.dirname(__file__),
        "static",
        "whichartifacts.html"
        )
    which_artifacts = open(which_artifacts_loc).read()

    # get the static_meta info for each metric
    try:
        r = requests.get('http://localhost:5001/provider')
        metadata = json.loads(r.text)
    except requests.ConnectionError:
        metadata = {}
    
    return render_template(
        'about.html',
        which_artifacts=which_artifacts,
        provider_metadata=metadata
        )

@app.route('/collection/<collection_id>')
def collection_report(collection_id):
    r = requests.get('http://localhost:5001/collection/' + collection_id)
    if r.status_code == 200:
        collection = json.loads(r.text)
        return render_template(
        'collection.html',
        collection=collection
        )
    else:
        abort(404)
        
@app.route("/commits")
def get_github_commits():
    commits = Github.get_commits(requests)
    resp = make_response( json.dumps(commits, sort_keys=True, indent=4), 200)        
    resp.mimetype = "application/json"
    return resp


@app.route('/call_api/<path:api_base>',methods = ['GET', 'PUT', 'POST', 'DELETE'])
def call_api(api_base):
	api_url = "http://" + os.environ["API_ROOT"] +'/'+ api_base

        # get the Requests http verb we'll use
	api_method = getattr(requests, request.method.lower())
        logger.info("calling api url: " + api_url)

        # read the headers we got from the client
        headers = {}
        for k, v in request.headers.iteritems():
            headers[k] = v

        # use Requests to call the total-impact-core api, wherever it lives
	api_response = api_method(
            api_url,
            params=request.args,
            headers=headers,
            data=request.data)

        logger.info("got api response back" + api_response)

        # pass the response we got from Requests back to our client
        resp = make_response(api_response.text)
        for k, v in api_response.headers.iteritems():
            resp.headers.add(k, v)

        return resp


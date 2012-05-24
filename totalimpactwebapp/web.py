import requests

from flask import Flask, jsonify, json, request, redirect, abort, make_response
from flask import render_template, flash

from totalimpactwebapp.tilogging import logging
from totalimpactwebapp.core import app

logger = logging.getLogger(__name__)

    
# static pages
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/about')
def about():
	return render_template('about.html')

@app.route('/collection/<collection_id>')
def collection_report(collection_id):
    r = requests.get('http://localhost:5001/collection/' + collection_id)
    if r.status_code == 200:
        collection = json.loads(r.text)
        return render_template('collection.html', collection=collection)
    else:
        abort(404)


@app.route('/call_api/<path:api_base>',methods = ['GET', 'PUT', 'POST', 'DELETE'])
def call_api(api_base):
	api_host = 'http://localhost:5001/'
	api_url = api_host + api_base
	api_method = getattr(requests, request.method.lower())

        headers = {}
        
        for k, v in request.headers.iteritems():
            headers[k] = v

	api_response = api_method(
            api_url,
            params=request.args,
            headers=headers,
            data=request.data)

        resp = make_response(api_response.text)
        for k, v in api_response.headers.iteritems():
            resp.headers.add(k, v)

        # hack becasue Requests doesn't seem to see the Content-Type header...

        return resp

if __name__ == "__main__":
    # run it
    app.run(host='0.0.0.0', debug=True)


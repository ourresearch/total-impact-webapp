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

@app.route('/call_api/<path:api_base>', 
	methods = ['GET', 'PUT', 'POST', 'DELETE'])
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

	return api_response.text

if __name__ == "__main__":
    # run it
    app.run(host='0.0.0.0', debug=True)


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
def content():
    return render_template('about.html')


if __name__ == "__main__":
    # run it
    app.run(host='0.0.0.0', debug=True)


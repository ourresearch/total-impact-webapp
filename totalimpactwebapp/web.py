import requests, iso8601, os

from flask import Flask, jsonify, json, request, redirect, abort, make_response
from flask import render_template, flash

from totalimpactwebapp.tilogging import logging
from totalimpactwebapp.core import app
from totalimpactwebapp import pretty_date

logger = logging.getLogger(__name__)

class GithubCommits():

    urls = {
        "core": "https://api.github.com/repos/total-impact/total-impact-core/commits",
        "webapp": "https://api.github.com/repos/total-impact/total-impact-webapp/commits"
    }

    @classmethod
    def get(cls, req):
        commits = {}
        for repo, url in cls.urls.iteritems():

            # implement caching here...
            resp = req.get(url)
            commits_list = json.loads(resp.text)
            
            for commit_obj in commits_list:
                timestamp = commit_obj["commit"]["author"]["date"]
                commits[timestamp] = commit_obj

        commits_arr = []
        for date in sorted(commits.iterkeys(), reverse=True):
            my_commit = commits[date]
            date_obj = iso8601.parse_date(date)
            my_commit['date'] = pretty_date.make_str(date_obj)
            my_commit['message'] = my_commit["commit"]["message"].split("\n")[0]
            my_commit['link'] = my_commit['url'].replace(
                "api.github.com/repos", "github.com").replace(
                "commits", "commit") # quick hack, use regex instead.
            try:
                my_commit['img'] = my_commit['author']['avatar_url']
            except TypeError:
                # hack becaue api doesn't return Jason's avatar_url for some reason
                if (my_commit['commit']['author']['name'] == "Jason Priem"):
                    my_commit['img'] = "https://secure.gravatar.com/avatar/b0374225943b94115f9f708c28dcac1f?s=140&d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-140.png"

            commits_arr.append(commits[date])

        return commits_arr[0:7]

'''
@app.route('/<dir>/static/<path:to_get>')
def fix_static_calls(dir, to_get):
    return redirect("/static/" + to_get)'''
    
# static pages
@app.route('/')
def home():
    return render_template('index.html', commits=GithubCommits.get(requests))

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
    r = requests.get('http://localhost:5001/provider')
    metadata = json.loads(r.text)
    
    which_metrics = "which metrics! who knows?"
    return render_template(
        'about.html',
        commits=GithubCommits.get(requests),
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
        collection=collection,
        commits=GithubCommits.get(requests)
        )
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


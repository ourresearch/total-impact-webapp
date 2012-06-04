import json, iso8601
from totalimpactwebapp import pretty_date

class Github():
    ''' this should be moved out of views into a model'''

    urls = {
        "core": "https://api.github.com/repos/total-impact/total-impact-core/commits",
        "webapp": "https://api.github.com/repos/total-impact/total-impact-webapp/commits"
    }

    @classmethod
    def get_commits(cls, req):
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

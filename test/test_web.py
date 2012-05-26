import unittest
from nose.tools import nottest, assert_equals
import json, os, requests

from totalimpactwebapp import web

class TestWeb(unittest.TestCase):
    @classmethod
    def setup_class(cls):
        cls.app = web.app.test_client()

    @classmethod
    def teardown_class(cls):
        pass

    def test_root(self):
        res = self.app.get('/')
        assert res.status == '200 OK', res.status

    def test_about(self):
        res = self.app.get('/about')
        assert res.status == '200 OK', res.status

class FakeResponse(object):
    pass

class FakeRequests():

    my_resp = FakeResponse()

    def get(self, url):

        resp_type = self.get_resp_key(url)
        resp_loc = os.path.join(
            os.path.dirname(__file__),
            "data",
            "github_commits",
            resp_type + ".json"
            )
            
        self.my_resp.text = open(resp_loc).read()
        return self.my_resp 

    def get_resp_key(self, url):
        if "webapp" in url:
            return "webapp"
        elif "core" in url:
            return "core"
        else:
            raise Exception("unexpected url: " + url)

class TestGithubCommits(unittest.TestCase):

    def test_get(self):
        commits = web.GithubCommits.get(FakeRequests())

        assert_equals(len(commits), 59)

    def test_get_returns_sorted_list(self):
        commits = web.GithubCommits.get(FakeRequests())
        assert isinstance(commits, list), type(commits)

        assert_equals(
            commits[0]["commit"]["author"]["date"],
            "2012-05-25T14:06:10-07:00"
            )



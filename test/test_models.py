import unittest
from nose.tools import nottest, assert_equals
import json, os, requests , unittest
from totalimpactwebapp import models
from test import mocks



class TestGithubCommits(unittest.TestCase):

    def test_get(self):
        commits = models.Github.get_commits(mocks.Requests())
        print commits

        assert_equals(len(commits), 7)

    def test_get_returns_sorted_list(self):
        commits = models.Github.get_commits(mocks.Requests())
        assert isinstance(commits, list), type(commits)

        assert_equals(
            commits[0]["commit"]["author"]["date"],
            "2012-05-25T14:06:10-07:00"
            )


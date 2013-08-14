import unittest
from nose.tools import nottest, assert_equals
import json, os, requests

from totalimpactwebapp import views, app

class TestViews(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()

    def test_root(self):
        res = self.app.get('/')
        assert res.status == '200 OK', res.status

    def test_about(self):
        res = self.app.get('/about')
        assert res.status == '200 OK', res.status




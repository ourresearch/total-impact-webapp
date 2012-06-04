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

    def test_commits(self):
        res = self.app.get('/commits')
        assert res.status == '200 OK', res.status
        assert res.mimetype == 'application/json', res.__dict__
        
        res_obj = json.loads(res.data)
        assert len(res_obj) > 0, res_obj
        
        
        
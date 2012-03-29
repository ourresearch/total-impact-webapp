import unittest
from nose.tools import nottest

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


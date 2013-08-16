import unittest
from nose.tools import nottest
from nose.tools import assert_equals
from nose.tools import assert_not_equals
from nose.tools import assert_true

from totalimpactwebapp.views_helpers import page_type
import random

class TestViewsHelpers(unittest.TestCase):

    def setUp(self):
        random.seed(42)

    def test_file_loads(self):
        assert True

    def test_index(self):
        type = page_type("index.html")
        assert_equals(type, "landing")

    def test_defaults_to_docs(self):
        type = page_type("some template we've never heard of.")
        assert_equals(type, "docs")


    def test_keyword_arg_overrides_lookup_table(self):
        type = page_type("some template name", page_type="custom type")
        assert_equals(type, "custom type")


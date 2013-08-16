import unittest
from nose.tools import nottest
from nose.tools import assert_equals
from nose.tools import assert_not_equals
from nose.tools import assert_true

import random

class TestViewsHelpers(unittest.TestCase):

    def setUp(self):
        random.seed(42)

    def test_file_loads(self):
        assert True

import unittest
from nose.tools import nottest
from nose.tools import assert_equals
from nose.tools import assert_not_equals
from nose.tools import assert_true

from totalimpactwebapp import user
import random

class TestUser(unittest.TestCase):

    def test_tiids_to_remove_from_deduplication_list(self):
        duplicates_list = [[{'tiid': u'a1', 'has_user_provided_biblio': False}, {'tiid': u'e1', 'has_user_provided_biblio': False}], [{'tiid': u'b2', 'has_user_provided_biblio': False}, {'tiid': u'c2', 'has_user_provided_biblio': False}, {'tiid': u'd2', 'has_user_provided_biblio': False}], [{'tiid': u'f3', 'has_user_provided_biblio': False}], [{'tiid': u'g4', 'has_user_provided_biblio': False}, {'tiid': u'h4', 'has_user_provided_biblio': True}]]
        response = user.tiids_to_remove_from_duplicates_list(duplicates_list)
        print response
        expected = [u'a1', u'b2', u'c2', u'g4']
        assert_equals(response, expected)

        duplicates_list = [[{'tiid': u'a1', 'has_user_provided_biblio': True}, {'tiid': u'e1', 'has_user_provided_biblio': False}], [{'tiid': u'b2', 'has_user_provided_biblio': False}, {'tiid': u'c2', 'has_user_provided_biblio': False}, {'tiid': u'd2', 'has_user_provided_biblio': False}], [{'tiid': u'f3', 'has_user_provided_biblio': False}], [{'tiid': u'g4', 'has_user_provided_biblio': False}, {'tiid': u'h4', 'has_user_provided_biblio': True}]]
        response = user.tiids_to_remove_from_duplicates_list(duplicates_list)
        print response
        expected = [u'e1', u'b2', u'c2', u'g4']
        assert_equals(response, expected)





import unittest
from nose.tools import nottest
from nose.tools import assert_equals
from nose.tools import assert_not_equals
from nose.tools import assert_true

from totalimpactwebapp import user
import random

class TestUser(unittest.TestCase):

    def setUp(self):
        random.seed(42)

    def test_file_loads(self):
        assert True


    def test_random_seed(self):
        assert_equals(
            random.randint(1000, 9999),
            6754
        )

    def test_instantiation(self):
        u = user.User("foo", "bar")

    def test_names_use_defaults_if_not_set_explicitly(self):
        u = user.User("foo", "bar")
        assert_equals(
            u.given_name,
            "Anonymous"
        )

        assert_equals(
            u.surname,
            "User"
        )

    def test_slug_smooshes_first_and_last_name(self):
        u = user.User("foo", "bar", given_name=u"Willie", surname=u"Nelson")
        assert_equals(
            u.url_slug,
            "WillieNelson"
        )

    def test_uniqueify_slug(self):
        u = user.User("foo", "bar", given_name=u"John", surname=u"Smith")
        assert_equals(
            u.url_slug,
            "JohnSmith"
        )
        u.uniqueify_slug()
        assert_equals(
            u.url_slug,
            "JohnSmith64303"
        )

    def test_uniqueify_slug_for_default_name(self):
        u = user.User(u"foo", u"bar")
        u.uniqueify_slug()
        assert_equals(
            u.url_slug,
            "AnonymousUser64303"
        )


    def test_initial_url_slug_is_ascii_even_when_names_are_unicode(self):
        u = user.User("foo", "bar",
                      given_name=u"Matsuo", surname=u"Bash\u014D")

        assert_equals(
            u.url_slug,
            u"MatsuoBasho"
        )

    def test_fails_gracefully_when_given_unasciiable_chars(self):
        # kanji don't degrade to anything useful in latin alphabet:
        u = user.User("foo", "bar", given_name=u"\u6000", surname=u"\u6001")
        assert_equals(
            u.url_slug,
            "user639787"
        )






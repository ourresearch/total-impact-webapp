from totalimpactwebapp import db
from util import cached_property
from util import commit
from util import dict_from_dir

import logging

logger = logging.getLogger("ti.refresh_status")


def save_profile_refresh_status(profile, status_string):
    profile.refresh_status = status_string
    db.session.add(profile)
    commit(db)

class RefreshStatus(object):
    states = {
        "REFRESH_START": "refresh start",
        "DEDUP_START": "dedup start",
        "TWEETS_START": "tweets start",
        "ALL_DONE": "all done"
    }

    def __init__(self, profile):
        self.profile = profile
        self.products = profile.display_products

    @property
    def refresh_state(self):
        return self.profile.refresh_status

    @property
    def is_done_refreshing(self):
        return self.num_refreshing==0

    @property
    def num_refreshing(self):
        return sum([product.is_refreshing for product in self.products])

    @property
    def num_complete(self):
        return len(self.products) - self.num_refreshing

    # @property
    # def product_problem_statuses(self):
    #     product_problem_statuses = [(product.tiid, product.last_refresh_status) for product in self.products if not product.finished_successful_refresh]
    #     return product_problem_statuses

    # @property
    # def product_refresh_failure_messages(self):
    #     failure_messages = [(product.tiid, product.last_refresh_failure_message) for product in self.products if product.last_refresh_failure_message]
    #     return failure_messages

    @property
    def percent_complete(self):
        try:
            precise = float(self.num_complete) / len(self.products) * 100
        except ZeroDivisionError:
            precise = 100

        return int(precise)

    def to_dict(self):
        attributes_to_exclude = [
            "states",
            "products",
            "profile"
        ]
        return dict_from_dir(self, attributes_to_exclude)


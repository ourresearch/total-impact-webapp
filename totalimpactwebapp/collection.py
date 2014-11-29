from totalimpactwebapp.profile import get_profile_from_id
from totalimpactwebapp.cards_factory import make_summary_cards
from totalimpactwebapp.product_markup import Markup
from totalimpactwebapp.tweet import tweets_from_tiids

from totalimpactwebapp import countries
from util import cached_property

from collections import defaultdict

import logging

logger = logging.getLogger("tiwebapp.profile")


def products_matching_tag(products, tagspace, tag):
    subset = []

    if tagspace=="genre":
        subset = [product for product in products if tag==product.genre]
    elif tagspace=="country":
        subset = [product for product in products if tag in product.countries_str]
    return subset


class Collection(object):
    def __init__(self, url_slug, tagspace, tag):
        self.profile = get_profile_from_id(url_slug, "url_slug")
        self.tagspace = tagspace
        self.tag = tag
        self.products = products_matching_tag(self.profile.display_products, tagspace, tag)

    @cached_property
    def tiids(self):
        return [product.tiid for product in self.products]

    @cached_property
    def country_list(self):
        country_list = countries.CountryList()
        country_list.add_from_products(self.products)
        return country_list

    @cached_property
    def summary_cards(self):
        cards = make_summary_cards(self.products)
        return cards

    @cached_property
    def tweets_by_tiid(self):
        tweets = tweets_from_tiids(self.tiids)
        resp = defaultdict(dict)
        for tweet in tweets:
            if self.tagspace=="country":
                if tweet.country != self.tag:
                    continue

            if tweet.tiid in resp and "tweets" in resp[tweet.tiid]:
                resp[tweet.tiid]["tweets"].append(tweet)
            else:
                resp[tweet.tiid].update({"tweets": [tweet]})
        return resp


    @cached_property
    def markup_by_tiid(self):
        show_keys = [
            "_tiid",
            "markup",
            "genre",
            "genre_icon"
        ]
        resp = defaultdict(dict)
        markup = Markup(self.profile.url_slug, False)  # profile_id must be a slug...
        for my_product in self.products:
            my_product_dict = my_product.to_markup_dict(markup, show_keys=show_keys)
            resp[my_product.tiid]["markup"] = my_product_dict
        return resp

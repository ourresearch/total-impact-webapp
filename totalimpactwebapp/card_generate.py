from totalimpactwebapp.card import Card
from totalimpactwebapp.util import as_int_or_float_if_possible
from totalimpactwebapp import products_list

import requests
import json


def products_above_threshold(product_dicts, metric_name, threshold):
    above_threshold = []
    for product in product_dicts:
        if (metric_name in product["metrics"]):
            value = product["metrics"][metric_name]["values"]["raw"]
            if value >= threshold:
                above_threshold.append(product)
    return above_threshold


def get_percentile(metric_dict):
    for value_type in metric_dict["values"]:
        # the keys that aren't "raw" are reference ests
        if value_type != "raw":
            return (metric_dict["values"][value_type]["estimate_lower"])
    return None


def get_threshold_just_crossed(current_value, diff_value, thresholds):
    try:
        previous_value = current_value - diff_value
    except TypeError:
        # not numeric
        return None

    for threshold in thresholds:
        if (current_value >= threshold) and (previous_value < threshold):
            return threshold
    return None

def get_median(metric_dict, medians_lookup):
    try:
        refset_year = metric_dict["refset_year"]
        refset_genre = metric_dict["refset_genre"]
        refset_name = metric_dict["refset"].lower()
        median = medians_lookup[refset_genre][refset_name][refset_year]
    except KeyError:
        median = None
    return median


def populate_card(user_id, tiid, metric_dict, metric_name, thresholds_lookup=[], medians_lookup={}):
    hist = metric_dict["historical_values"]
    current_value = as_int_or_float_if_possible(hist["current"]["raw"])
    weekly_diff = as_int_or_float_if_possible(hist["diff"]["raw"])
    thresholds = thresholds_lookup.get(metric_name, [])

    my_card = Card(
        card_type="new metrics",
        granularity="product",
        metric_name=metric_name,
        user_id=user_id,
        tiid=tiid,
        weekly_diff=weekly_diff,
        current_value=current_value,
        percentile_current_value=get_percentile(metric_dict),
        median=get_median(metric_dict, medians_lookup),
        threshold_awarded=get_threshold_just_crossed(current_value, weekly_diff, thresholds),
        weight=0.7
    )

    return my_card


def get_product_list_for_cards(user):
    product_dicts = products_list.prep(
            user.products,
            include_headings=False,
            display_debug=True
        )
    return product_dicts


def get_medians_lookup():
    url = "http://total-impact-core-staging.herokuapp.com/collections/reference-sets-medians"
    resp = requests.get(url)
    return json.loads(resp.text)


class CardGenerator:
    pass




class ProductNewMetricCardGenerator(CardGenerator):

    @classmethod
    def make(cls, user):
        thresholds_lookup = {
            "mendeley:readers": [5, 10, 25, 50, 75, 100]
            }
        medians_lookup = get_medians_lookup()

        cards = []
        product_dicts = get_product_list_for_cards(user)

        for product in product_dicts:
            metrics_dict = product["metrics"]
            tiid = product["_id"]

            for metric_name in metrics_dict:
                weekly_diff = metrics_dict[metric_name]["historical_values"]["diff"]["raw"]

                # this card generator only makes cards with weekly diffs
                if weekly_diff:
                    new_card = populate_card(user.id, tiid, metrics_dict[metric_name], metric_name, thresholds_lookup, medians_lookup)

                    # now populate with profile-level information
                    peers = products_above_threshold(product_dicts, metric_name, new_card.current_value)
                    new_card.num_profile_products_this_good = len(peers)

                    # and keep the card
                    cards.append(new_card)

        return cards


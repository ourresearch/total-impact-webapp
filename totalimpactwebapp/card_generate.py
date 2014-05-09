from totalimpactwebapp.card import Card
from totalimpactwebapp.util import as_int_or_float_if_possible
from totalimpactwebapp import products_list
from totalimpactwebapp import thresholds as thresh

import requests
import json
import datetime
import arrow


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
        refset_name = "unknown"
        for (key, val) in metric_dict["values"].iteritems():
            try:
                if "CI95_lower" in val.keys():
                    refset_name = key
            except AttributeError:
                pass
        metric_name = metric_dict["name"]

        median = medians_lookup[refset_genre][refset_name][refset_year][metric_name]
    except KeyError:
        median = None
    return median


def populate_card(user_id, tiid, metric_dict, metric_name, thresholds_lookup=[], medians_lookup={}):
    hist = metric_dict["historical_values"]
    current_value = as_int_or_float_if_possible(hist["current"]["raw"])
    diff_value = as_int_or_float_if_possible(hist["diff"]["raw"])
    thresholds = thresholds_lookup.get(metric_name, [])
    newest_diff_timestamp = arrow.get(hist["current"]["collected_date"]).datetime
    oldest_diff_timestamp = arrow.get(hist["previous"]["collected_date"]).datetime

    my_card = Card(
        card_type="new metrics",
        granularity="product",
        metric_name=metric_name,
        user_id=user_id,
        tiid=tiid,
        diff_value=diff_value,
        current_value=current_value,
        newest_diff_timestamp=newest_diff_timestamp,
        oldest_diff_timestamp=oldest_diff_timestamp, 
        diff_window_days = (newest_diff_timestamp - oldest_diff_timestamp).days,
        percentile_current_value=get_percentile(metric_dict),
        median=get_median(metric_dict, medians_lookup),
        threshold_awarded=get_threshold_just_crossed(current_value, diff_value, thresholds),
        weight=0.7
    )

    return my_card



def get_medians_lookup():
    url = "http://total-impact-core.herokuapp.com/collections/reference-sets-medians"
    resp = requests.get(url)
    return json.loads(resp.text)


class CardGenerator:
    pass











"""
 ProductNewMetricCardGenerator
 *************************************************************************** """



class ProductNewMetricCardGenerator(CardGenerator):

    @classmethod
    def make(cls, user, product_dicts):
        thresholds_lookup = thresh.values["product"]
        medians_lookup = get_medians_lookup()

        cards = []

        for product in product_dicts:
            metrics_dict = product["metrics"]
            tiid = product["_id"]

            for metric_name in metrics_dict:
                diff_value = metrics_dict[metric_name]["historical_values"]["diff"]["raw"]

                # this card generator only makes cards with weekly diffs
                if diff_value:
                    new_card = populate_card(user.id, tiid, metrics_dict[metric_name], metric_name, thresholds_lookup, medians_lookup)

                    # now populate with profile-level information
                    peers = products_above_threshold(product_dicts, metric_name, new_card.current_value)
                    new_card.num_profile_products_this_good = len(peers)

                    # and keep the card
                    cards.append(new_card)

        return cards




"""
 ProfileNewMetricCardGenerator
 *************************************************************************** """


class ProfileNewMetricCardGenerator(CardGenerator):

    @classmethod
    def make(cls, user, product_dicts):
        thresholds_lookup = thresh.values["profile"]
        medians_lookup = get_medians_lookup()        

        metrics_to_accumulate = []
        cards = []
        metric_totals = {}

        for (metric_name, thresholds) in thresholds_lookup.iteritems():

            if "citations" in metric_name:
                continue  # we aren't allowed to accumulate scopus, don't want to accumulate PMC ciations

            accumulating_card = Card(
                    card_type="new metrics",
                    granularity="profile",
                    metric_name=metric_name,
                    user_id=user.id,
                    newest_diff_timestamp=arrow.get(datetime.datetime.min).datetime,  #initiate with a very recent value
                    oldest_diff_timestamp=arrow.get(datetime.datetime.max).datetime,  #initiate with a very recent value
                    diff_value=0,
                    current_value=0,
                    weight=0.8
                )            

            for product in product_dicts:
                tiid = product["_id"]
                try:
                    metric_dict = product["metrics"][metric_name]
                    hist = metric_dict["historical_values"]
                    product_current_value = as_int_or_float_if_possible(hist["current"]["raw"])
                    product_diff_value = as_int_or_float_if_possible(hist["diff"]["raw"])
                    current_diff_timestamp = arrow.get(hist["current"]["collected_date"]).datetime
                    previous_diff_timestamp = arrow.get(hist["previous"]["collected_date"]).datetime

                    try:
                        accumulating_card.current_value += product_current_value
                        accumulating_card.diff_value += product_diff_value
                    except TypeError:
                        pass
                    if current_diff_timestamp > accumulating_card.newest_diff_timestamp:
                        accumulating_card.newest_diff_timestamp = current_diff_timestamp
                    if previous_diff_timestamp < accumulating_card.oldest_diff_timestamp:
                        accumulating_card.oldest_diff_timestamp = previous_diff_timestamp

                except KeyError:
                    # this product doesn't have this metric
                    pass

            # only keep card if accumulating
            if accumulating_card.diff_value:
                accumulating_card.threshold_awarded = get_threshold_just_crossed(
                    accumulating_card.current_value, 
                    accumulating_card.diff_value, 
                    thresholds)
                if accumulating_card.threshold_awarded:
                    accumulating_card.diff_window_days = (accumulating_card.newest_diff_timestamp - accumulating_card.oldest_diff_timestamp).days
                    cards.append(accumulating_card)

        return cards













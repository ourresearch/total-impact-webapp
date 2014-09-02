from totalimpactwebapp.card import ProductNewMetricCard
from totalimpactwebapp.card import ProfileNewMetricCard
import configs

import datetime



def make_product_new_metrics_cards(profile, timestamp=None):

    if not timestamp:
        timestamp = datetime.datetime.utcnow()

    cards = []
    for product in profile.products_not_removed:

        for metric in product.metrics:
            if ProductNewMetricCard.would_generate_a_card(metric):
                new_card = ProductNewMetricCard(profile, product, metric)
                cards.append(new_card)

    return cards


def make_profile_new_metrics_cards(profile, timestamp=None):
    if not timestamp:
        timestamp = datetime.datetime.utcnow()

    cards = []
    all_possible_metrics_config_dicts = configs.metrics().values()

    for metric_config in all_possible_metrics_config_dicts:
        provider = metric_config["provider"]
        interaction = metric_config["interaction"]

        if "citations" in interaction:
            continue  # we aren't allowed to accumulate scopus, don't want to accumulate PMC ciations

        if ProfileNewMetricCard.would_generate_a_card(profile, provider, interaction):
            new_card = ProfileNewMetricCard(profile, provider, interaction)
            cards.append(new_card)

    return cards









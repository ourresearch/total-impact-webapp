from totalimpactwebapp.card import Card
from totalimpactwebapp import configs
from totalimpactwebapp.cards_factory import *
import os

def make(profile):
    cards = []
    #cards += ProductNewMetricCardsFactory.make(profile)
    #cards += ProfileNewMetricCardsFactory.make(profile)

    cards += make_product_new_metrics_cards(profile)

    #cards = filter_cards(cards)
    cards = sort_cards(cards)[0:10]

    response = {
        "profile": profile,
        "cards": cards,
        "css": get_css()
    }
    return response


def get_css():
    path = os.path.join(
        os.path.dirname(__file__),
        'static/less.emails/css/new-metrics.css'
    )
    file = open(path, "r")
    return file.read()


def sort_cards(cards):
    sorted_cards = sorted(cards, key=lambda card: card.sort_by, reverse=True)
    return sorted_cards


def filter_cards(cards):
    ret = []
    for card in cards:
        try:
            if int(card.diff_value) <= 0:
                pass
            elif "pubmed" in card.metric_name:
                pass
            else:
                ret.append(card)

        # no integerable diff_value        
        except (ValueError, TypeError):
            pass

    return ret




















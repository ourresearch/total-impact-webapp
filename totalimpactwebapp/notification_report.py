from totalimpactwebapp.card import Card
from totalimpactwebapp import configs
from totalimpactwebapp.card_generate import *
import os


import datetime


def make(user):

    products = user.product_objects
    user_dict_about = user.dict_about()

    cards = []
    cards += ProductNewMetricCardGenerator.make(user, products)
    cards += ProfileNewMetricCardGenerator.make(user, products)

    for card in cards:
        card.set_product_from_list(products)
        card.metrics_info = configs.metrics()[card.metric_name]
        card.user = user_dict_about

    cards = filter_cards(cards)
    cards = sort_cards(cards)[0:10]

    response = {
        "user": user_dict_about,
        "cards": cards,
        "css": get_css(),
        "given_name": user.given_name
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
    sorted_cards = sorted(cards, key=lambda card: card.sort_by(), reverse=True)
    return sorted_cards


def filter_cards(cards):
    ret = []
    for card in cards:
        if int(card.diff_value) <= 0:
            pass
        elif "pubmed" in card.metric_name:
            pass
        else:
            ret.append(card)

    return ret




















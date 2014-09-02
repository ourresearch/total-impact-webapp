from totalimpactwebapp.cards_factory import *
import os

def get_all_cards(profile):
    cards = []
    cards += make_product_new_metrics_cards(profile.products_not_removed, url_slug=profile.url_slug)
    cards += make_profile_new_metrics_cards(profile.products_not_removed, url_slug=profile.url_slug)
    return cards


def make(profile):
    cards = get_all_cards(profile)

    cards = filter_cards(cards)
    cards = sort_cards(cards)
    cards = cards[0:10]

    response = {
        "profile": profile,
        "css": get_css(),
        "cards": cards
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
            if card.provider != "pubmed":
                ret.append(card)
        except AttributeError:
            # no provider method
            pass

    return ret




















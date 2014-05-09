from totalimpactwebapp.card import Card
from totalimpactwebapp import providers_info
from totalimpactwebapp.card_generate import *
from totalimpactwebapp import products_list


import datetime


def make(user):

    products = user.products
    prepped_products = products_list.prep(
            products,
            include_headings=False,
            display_debug=True
    )
    user_dict_about = user.dict_about()

    cards = []
    cards += ProductNewMetricCardGenerator.make(user, prepped_products)
    cards += ProfileNewMetricCardGenerator.make(user, prepped_products)

    for card in cards:
        pass
        card.set_product_from_list(products)
        card.metrics_info = providers_info.metrics()
        card.user = user_dict_about

    response = {
        "user": user_dict_about,
        "cards": cards
    }
    return response




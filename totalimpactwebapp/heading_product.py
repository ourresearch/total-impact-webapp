import re
from flask import render_template
from totalimpactwebapp import product_configs




def make_for_category(genre, account, category_products):

    anchor = genre
    if account:
        anchor += "-" + re.sub(r"[^\w]", r"-", account)

    anchor = anchor.replace("--", "-")
    try:
        icon = product_configs.genre_icons[genre]
    except KeyError:
        icon = product_configs.genre_icons["unknown"]

    heading_product = {
        'is_heading': True,
        '_id': anchor,
        'anchor': anchor,
        'genre': genre,
        'icon': icon,
        'account': account,
        'headingDimension': 'category',
        'summary': {
            'numProducts': len(category_products)
        }
    }

    for product in category_products:

        if len(product["metrics"].values()) > 0:
            heading_product["has_metrics"] = True

        if product["has_new_metrics"]:
            heading_product["has_new_metrics"] = True

        # extract relevant info from the account product, if there is one.
        if "is_account" in product["biblio"].keys():
            heading_product["metrics"] = product["metrics"].values()
            heading_product["account_biblio"] = product["biblio"]
            break

    try:
        heading_product["account_url"] = heading_product["account_biblio"]["url"]
    except KeyError:
        heading_product["account_url"] = None

    heading_product["markup"] = {
        "biblio": make_markup(heading_product)
    }

    return heading_product






def make_markup(heading_product):
    return render_template(
        "heading-product.html",
        product=heading_product
    )
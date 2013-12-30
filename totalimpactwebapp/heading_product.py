import re
from flask import render_template
from totalimpactwebapp import product_configs




def make_for_category(genre, account, category_products):

    anchor = genre
    if account:
        anchor += "-" + re.sub(r"[^\w]", r"-", account)

    anchor = anchor.replace("--", "-")

    heading_product = {
        'isHeading': True,
        '_id': anchor,
        'anchor': anchor,
        'genre': genre,
        'icon': product_configs.genre_icons[genre],
        'account': account,
        'headingDimension': 'category',
        'summary': {
            'numProducts': len(category_products)
        }
    }

    # extract relevant info from the account product, if there is one.
    for product in category_products:
        if "is_account" in product["biblio"].keys():
            heading_product["metrics"] = product["metrics"].values()
            heading_product["account_biblio"] = product["biblio"]
            break

    try:
        heading_product["account_url"] = heading_product["account_biblio"]["url"]
    except KeyError:
        heading_product["account_url"] = None

    heading_product["markup"] = make_markup(heading_product)

    return heading_product






def make_markup(heading_product):
    return render_template(
        "heading-product.html",
        product=heading_product
    )
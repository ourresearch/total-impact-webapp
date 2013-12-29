import re


def make_for_category(genre, account, category_products):

    anchor = genre
    if account:
        anchor += "-" + re.sub(r"[^\w]", r"-", account)

    anchor = anchor.replace("--", "-")

    heading_product = {
        'isHeading': True,
        '_id': anchor,
        'genre': genre,
        'account': account,
        'headingDimension': 'category',
        'summary': {
            'numProducts': len(category_products)
        }
    }

    heading_product["markup"] = make_markup(heading_product)

    # extract relevant info from the account product
    for product in category_products:
        if "is_account" in product["biblio"].keys():
            heading_product["metrics"] = product["metrics"]
            heading_product["account_biblio"] = product["biblio"]

    return heading_product






def make_markup(heading_product):
    return "<h1>heading!</h1>"

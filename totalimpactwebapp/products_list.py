import re
import os
import requests
import json
from totalimpactwebapp import product
from flask import g


def add_category_heading_products(products):

    categories = categorize_products(products)



    heading_products_list = []

    for category_key, category_products in categories.iteritems():

        heading_product = make_heading_product_for_category(
            category_key[0],  # genre
            category_key[1],  # account
            category_products
        )

        heading_products_list.append(heading_product)

    return heading_products_list + remove_account_products(products)


def make_heading_product_for_category(genre, account, category_products):

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
        'summary':{
            'numProducts': len(category_products)
        },
    }

    # extract relevant info from the account product
    for product in category_products:
        if "is_account" in product["biblio"].keys():
            heading_product["metrics"] = product["metrics"]
            heading_product["account_biblio"] = product["biblio"]

    return heading_product


def remove_account_products(products):
    ret = []
    for product in products:

        try:
            if not product['biblio']['is_account']:
                ret.append(product)
        except KeyError:
            ret.append(product)

    return ret


def categorize_products(products):
    categories = {}
    for product in products:
        genre = product["biblio"]["genre"]
        try:
            account = product["biblio"]["account"].lower()
        except KeyError:
            account = None


        categories.setdefault((genre, account), []).append(product)

    return categories


def add_sort_keys(products):
    for product in products:
        try:
            product["genre"] = product["biblio"]["genre"]
        except KeyError:
            product["genre"] = "unknown"

        try:
            product["account"] = product["biblio"]["account"]
        except KeyError:
            product["account"] = None

    return products


def add_markup_to_products(products, url_slug):
    for product_dict in products:
        product_dict['markup'] = product.markup(product_dict, url_slug)

    return products


def prep(products_dict, url_slug, include_headings=False, include_markup=False):

    products = add_sort_keys(products_dict)

    if include_markup:
        for product_dict in products:
            product_dict['markup'] = product.markup(product_dict, url_slug)

    if include_headings:
        products = add_category_heading_products(products)


    return products





def get_duplicates_list_from_tiids(tiids):
    if not tiids:
        return None

    query = u"{core_api_root}/v1/products/duplicates?api_admin_key={api_admin_key}".format(
        core_api_root=g.api_root,
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )

    r = requests.post(query,
        data=json.dumps({
            "tiids": tiids
            }),
        headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    return r.json()["duplicates_list"]






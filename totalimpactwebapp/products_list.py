import re
import os
import requests
import json
from totalimpactwebapp import product
from totalimpactwebapp import heading_product
from flask import g





def prep(products_dict, headings=None, awards=None, markup=None):

    product_dicts = []

    for product_dict in products_dict:

        try:
            new_product = product.make(product_dict)
            product_dicts.append(new_product.to_dict(awards, markup))
        except product.GenreDeprecatedError:
            pass

    if headings:
        product_dicts += make_heading_products(product_dicts)

    return product_dicts



def has_new_metrics(products_list):

    for product_dict in products_list:
        if product.make_has_new_metrics(product_dict):
            return True

    return False

def latest_diff_timestamp(products_list):
    prepped = prep(products_list, hide_markup=True)
    timestamps = [p["latest_diff_timestamp"] for p in prepped]

    try:
        return sorted(timestamps, reverse=True)[0]
    except IndexError:
        return None









"""
Category Heading stuff
"""

def make_heading_products(products):

    categories = categorize_products(products)

    heading_products_list = []

    for category_key, category_products in categories.iteritems():

        my_heading_product = heading_product.make_for_category(
            category_key[0],  # genre
            category_key[1],  # account
            category_products
        )

        heading_products_list.append(my_heading_product)

    return heading_products_list



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











"""
duplicates stuff
"""



def get_duplicates_list_from_tiids(tiids):
    if not tiids:
        return []

    query = u"{core_api_root}/v1/products/duplicates?api_admin_key={api_admin_key}".format(
        core_api_root=os.getenv("API_ROOT"),
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )

    r = requests.post(query,
        data=json.dumps({
            "tiids": tiids
            }),
        headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    try:
        duplicates_list = r.json()["duplicates_list"]
    except ValueError:
        print "got ValueError in get_duplicates_list_from_tiids, maybe decode error?"
        duplicates_list = []

    return duplicates_list






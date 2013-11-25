"""
A place to Get Stuff Out Of Views.

As this fills up, move into different places...this is just a handy bucket for
now, until we understand better what organization we need.
"""
import requests
import re


def get_product_for_embed_user(userid, tiid, api_root, admin_key):
    product = None

    if userid == "embed":
        query = "{core_api_root}/v1/item/{tiid}?api_admin_key={api_admin_key}".format(
            core_api_root=api_root,
            tiid=tiid,
            api_admin_key=admin_key
        )
        r = requests.get(query)
        if r.status_code == 200:
            product = r.json()

    return product


def remove_script_tags(str):
    inside = re.match("<script[^>]+>(.+)</script>", str)
    if inside:
        return inside.group(1)
    else:
        return ""











"""
A place to Get Stuff Out Of Views.

As this fills up, move into different places...this is just a handy bucket for
now, until we understand better what organization we need.
"""

page_type_dict = {
    "account": [
        "change-password.html",
        "create-collection.html",
        "login.html",
        "reset-password.html"
    ],
    "admin": [
        "generate-api.html"
    ],
    "item": [
        "item.html"
    ],
    "landing": [
        "index.html"
    ],
    "old_collection": [
        "collection.html"
    ],
    "preferences": [
        "user-preferences.html"
    ],
    "profile": [
        "user-profile.html"
    ]
}


def page_type(filename, **kwargs):
    if "page_type" in kwargs:
        return kwargs["page_type"]

    for page_type, paths in page_type_dict.iteritems():
        if filename in paths:
            return page_type

    return "docs"
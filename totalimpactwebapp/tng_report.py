from totalimpactwebapp.cards_factory import *
import os


def make(profile):

    response = {
        "profile": profile,
        "css": get_css(),
    }
    return response


def get_css():
    path = os.path.join(
        os.path.dirname(__file__),
        'static/less.emails/css/new-metrics.css'
    )
    file = open(path, "r")
    return file.read()




















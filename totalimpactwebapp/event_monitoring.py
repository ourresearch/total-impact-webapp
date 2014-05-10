"""
This module is for letting us know when various events happen by using
alert systems like Zapier or Pagerduty.
"""

from totalimpactwebapp.testing import is_test_email
import os
import requests

def new_user(slug, email):
    webhook_slugs = os.getenv("ZAPIER_ALERT_HOOKS", None)
    if (webhook_slugs is None) or is_test_email(email):
        return False

    for webhook_slug in webhook_slugs.split(","):

        zapier_webhook_url = "http://zapier.com/hooks/catch/n/{webhook_slug}/".format(
            webhook_slug=webhook_slug)
        data = {
            "user_profile_url": "https://impactstory.org/" + slug
        }
        headers = {'Content-type': 'application/json', 'Accept': 'application/json'}

        r = requests.post( zapier_webhook_url, data=data, headers=headers)

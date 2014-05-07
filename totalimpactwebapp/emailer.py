import mandrill
import os
import logging
from flask import render_template
from flask import render_template_string
from totalimpactwebapp.testing import is_test_email


logger = logging.getLogger("tiwebapp.emailer")

def send(address, name, html, text, context, lookup_templates=True):

    if is_test_email(address):
        return False

    if lookup_templates:
        html_to_send = render_template(html, context)
        text_to_send = render_template(text, context)
    else:
        html_to_send = render_template_string(html, context)
        text_to_send = render_template_string(text, context)

    mailer = mandrill.Mandrill(os.getenv("MANDRILL_APIKEY"))

    msg = {
        "text": text_to_send,
        "html": html_to_send,
        "subject": "Welcome to Impactstory!",
        "from_email": "team@impactstory.org",
        "from_name": "The Impactstory team",
        "to": [{"email": address, "name": name}],  # must be a list
        "track_opens": True,
        "track_clicks": True
    }

    if context["tags"]:
        msg["tags"] = context["tags"]

    mailer.messages.send(msg)
    logger.info(u"Sent an email to " + address)



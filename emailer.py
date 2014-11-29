import mandrill
import os
import logging
import jinja2
from totalimpactwebapp.testing import is_test_email


logger = logging.getLogger("tiwebapp.emailer")

def send(address, subject, template_name, context):

    if is_test_email(address):
        return False

    templateLoader = jinja2.FileSystemLoader(searchpath="totalimpactwebapp/templates")
    templateEnv = jinja2.Environment(loader=templateLoader)
    html_template = templateEnv.get_template(template_name + ".html")

    html_to_send = html_template.render(context)

    mailer = mandrill.Mandrill(os.getenv("MANDRILL_APIKEY"))

    addressee = {"email": address}
    try:
        addressee["name"] = context["name"]
    except KeyError:
        pass


    msg = {
        "html": html_to_send,
        "subject": subject,
        "from_email": "team@impactstory.org",
        "from_name": "The Impactstory team",
        "to": [addressee],  # must be a list
        "track_opens": True,
        "track_clicks": True
    }

    try:
        msg["tags"] = context["tags"]
    except KeyError:
        pass

    mailer.messages.send(msg)
    logger.info(u"Sent an email to " + address)

    return msg



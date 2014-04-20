import mandrill
import os
import logging


logger = logging.getLogger("tiwebapp.welcome_email")


class WelcomeEmailError(Exception):
    pass


domains_to_ignore = [
    ""
]


def send_welcome_email(email, given_name):

    # send the email here...
    mailer = mandrill.Mandrill(os.getenv("MANDRILL_APIKEY"))

    text = """Hi {given_name},\nWelcome to Impactstory!  You just joined thousands of other cutting-edge researchers who are discovering the full impact of their research.\n\n\
Got any questions? Drop us a line at team@impactstory.org and we'll be glad to help.\n\n
Want inside tips and insights about open science and altmetrics, along with actionable content that helps maximize your research impact? Then you're going to absolutely love our free newsletter. Check it out here: http://eepurl.com/RaRZ1\n\n
As a non-profit, we're passionate about helping to build a more open, expansive, and web-native science. It's why we do this. And we're thrilled that you've chosen to be part of it.\n\n
All our best,\nHeather, Jason, and Stacy""".format(given_name=given_name)

    html = """<p>Hi {given_name},</p>
<p>Welcome to Impactstory!  You just joined thousands of other cutting-edge researchers who are discovering the full impact of their research.</p>
<p>Got any questions? Drop us a line at team@impactstory.org and we'll be glad to help.</p>
<p>Want inside tips and insights about open science and altmetrics, along with actionable content that helps maximize your research impact? Then you're going to absolutely love our free newsletter: <a href='http://eepurl.com/RaRZ1'>click here to check it out.</a></p>
<p>As a non-profit, we're passionate about helping to build a more open, expansive, and web-native science. It's why we do this. And we're thrilled that you've chosen to be part of it.</p>
<p>All our best,<br>Heather, Jason, and Stacy</p>""".format(given_name=given_name)

    msg = {
        "text": text,
        "html": html,
        "subject": "Welcome to Impactstory!",
        "from_email": "team@impactstory.org",
        "from_name": "The Impactstory team",
        "to": [{"email": email, "name": given_name}],  # must be a list
        "tags": ["password-resets"],
        "track_opens": False,
        "track_clicks": False
    }
    mailer.messages.send(msg)
    logger.info(u"Sent a welcome email to " + email)

    return True







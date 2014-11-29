from sqlalchemy.schema import Sequence
from totalimpactwebapp import json_sqlalchemy
from util import commit

from totalimpactwebapp import db
import os
import datetime

def get_css():
    path = os.path.join(
        os.path.dirname(__file__),
        'static/less.emails/css/drip.css'
    )
    file = open(path, "r")
    return file.read()

def drip_email_context(profile, drip_milestone):
    subjects = {
        "last-chance": "Your Impactstory profile is new and improved--but it disappears in 2 days"
    }
    template = u"drip-{drip_milestone}".format(drip_milestone=drip_milestone)

    response = {
        "template": template,
        "subject": subjects[drip_milestone],
        "profile": profile,
        "css": get_css()
    }
    return response


def log_drip_email(profile, drip_milestone):
    now = datetime.datetime.utcnow()
    new_drip_email = DripEmail(
        profile_id=profile.id, 
        profile_age_days=(now - profile.created).days,
        date_sent=now,
        drip_milestone=drip_milestone,
        email_version="first"
        )
    db.session.add(new_drip_email)
    commit(db)


class DripEmail(db.Model):

    id = db.Column(db.Integer, Sequence('dripemail_id_seq'), primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    date_sent = db.Column(db.DateTime())
    profile_age_days = db.Column(db.Integer)
    drip_milestone = db.Column(db.Text)  
    email_version = db.Column(db.Text)

    def __init__(self, **kwargs):
        super(DripEmail, self).__init__(**kwargs)

    def __repr__(self):
        return u'<DripEmail {profile_id} {drip_milestone} {date_sent}>'.format(
            profile_id=self.profile_id, drip_milestone=self.drip_milestone, date_sent=self.date_sent)


















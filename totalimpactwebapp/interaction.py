from sqlalchemy.schema import Sequence
from sqlalchemy.orm import deferred
from totalimpactwebapp import json_sqlalchemy
from util import commit
import requests
import geoip2.webservice
from geoip2.errors import AddressNotFoundError

from totalimpactwebapp import db
import os

def log_interaction_event(tiid, ip, event, headers, timestamp):
    new_interaction = Interaction(
        tiid=tiid,
        timestamp=timestamp,
        event=event,
        ip=ip,
        headers=headers)
    db.session.add(new_interaction)
    commit(db)


def make(raw_dict):
    return Interaction(raw_dict)

def get_ip_insights(ip):
    try:
        client = geoip2.webservice.Client(os.getenv("MAXMIND_USER"), os.getenv("MAXMIND_KEY"))
        insights = client.insights(ip)
    except AddressNotFoundError:
        insights = None
    return insights

class Interaction(db.Model):
    interaction_id = db.Column(db.Integer, Sequence('interaction_id_seq'), primary_key=True)
    tiid = db.Column(db.Text, db.ForeignKey('item.tiid'), primary_key=True)
    timestamp = db.Column(db.DateTime())
    event = db.Column(db.Text)
    ip = db.Column(db.Text)
    headers = deferred(db.Column(json_sqlalchemy.JSONAlchemy(db.Text)))
    country = db.Column(db.Text)       # ALTER TABLE interaction ADD country text;
    user_type = db.Column(db.Text)     # ALTER TABLE interaction ADD user_type text;

    def __init__(self, **kwargs):
        insights = get_ip_insights(kwargs["ip"])
        if insights:
            self.country = insights.country.iso_code
            self.user_type = insights.traits.user_type
        super(Interaction, self).__init__(**kwargs)

    def __repr__(self):
        return u'<Interaction {tiid} {event} {timestamp}>'.format(
            tiid=self.tiid, event=self.event, timestamp=self.timestamp)




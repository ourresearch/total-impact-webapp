from sqlalchemy.schema import Sequence
from totalimpactwebapp import json_sqlalchemy
from totalimpactwebapp.util import commit
import requests
import geoip2.webservice

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
    client = geoip2.webservice.Client(os.getenv("MAXMIND_USER"), os.getenv("MAXMIND_KEY"))
    insights = client.insights(ip)
    return insights

class Interaction(db.Model):
    interaction_id = db.Column(db.Integer, Sequence('interaction_id_seq'), primary_key=True)
    tiid = db.Column(db.Text, db.ForeignKey('item.tiid'), primary_key=True)
    timestamp = db.Column(db.DateTime())
    event = db.Column(db.Text)
    ip = db.Column(db.Text)
    headers = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))
    country = db.Column(db.Text)       # ALTER TABLE interaction ADD country text;
    user_type = db.Column(db.Text)     # ALTER TABLE interaction ADD user_type text;

    def __init__(self, **kwargs):
        insights = get_ip_insights(self.ip)
        self.country = insights.country.iso_code
        self.user_type = insights.traits.user_type
        super(Interaction, self).__init__(**kwargs)

    def __repr__(self):
        return u'<Interaction {tiid} {event} {timestamp}>'.format(
            tiid=self.tiid, event=self.event, timestamp=self.timestamp)




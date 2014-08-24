from sqlalchemy.schema import Sequence
from totalimpactwebapp import json_sqlalchemy
from totalimpactwebapp.util import commit

from totalimpactwebapp import db


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


class Interaction(db.Model):

    __tablename__ = 'interaction'

    interaction_id = db.Column(db.Integer, Sequence('interaction_id_seq'), primary_key=True)
    tiid = db.Column(db.Text, db.ForeignKey('item.tiid'), primary_key=True)
    timestamp = db.Column(db.DateTime())
    event = db.Column(db.Text)
    ip = db.Column(db.Text)
    headers = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))
    country = db.Column(db.Text)

    def __init__(self, **kwargs):
        super(Interaction, self).__init__(**kwargs)


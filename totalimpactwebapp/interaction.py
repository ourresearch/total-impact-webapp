from sqlalchemy.schema import Sequence

from totalimpactwebapp import db


def make(raw_dict):
    return Interaction(raw_dict)


class Interaction(db.Model):

    __tablename__ = 'interaction'

    # interaction_id = db.Column(db.Integer, Sequence('interaction_id_seq'), primary_key=True)
    # profile_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    tiid = db.Column(db.Text, db.ForeignKey('item.tiid'), primary_key=True)
    # ip = db.Column(db.Text)
    # timestamp = db.Column(db.DateTime())
    # event = db.Column(db.Text)
    # headers = db.Column(db.Text)

    def __init__(self, **kwargs):
        super(Interaction, self).__init__(**kwargs)


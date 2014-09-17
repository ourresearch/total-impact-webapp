from sqlalchemy.schema import Sequence
from totalimpactwebapp import json_sqlalchemy
from totalimpactwebapp.util import commit
from totalimpactwebapp import db

import datetime
import logging
logger = logging.getLogger('ti.pinboard')


def write_to_pinboard(profile_id, contents):
    board = Pinboard.query.filter_by(profile_id=profile_id).first()
    if board:
        board.contents = contents
        board.timestamp = datetime.datetime.utcnow()
    else:
        board = Pinboard(
            profile_id=profile_id,
            contents=contents)
    db.session.merge(board)
    commit(db)
    return contents


class Pinboard(db.Model):
    pinboard_id = db.Column(db.Integer, Sequence('pinboard_id_seq'))
    profile_id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime())
    contents = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))

    def __init__(self, **kwargs):
        self.timestamp = datetime.datetime.utcnow()
        super(Pinboard, self).__init__(**kwargs)

    def __repr__(self):
        return u'<Pinboard {profile_id} {timestamp} {contents}>'.format(
            profile_id=self.profile_id, timestamp=self.timestamp, contents=self.contents)


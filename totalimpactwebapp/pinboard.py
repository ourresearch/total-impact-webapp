from sqlalchemy.schema import Sequence
from totalimpactwebapp import json_sqlalchemy
from totalimpactwebapp.util import commit
from totalimpactwebapp import db

import datetime
import logging
logger = logging.getLogger('ti.pinboard')

def set_key_metrics(profile_id, key_metrics_ids):
    return write_to_pinboard(profile_id, key_metrics_ids, "two")

def set_key_products(profile_id, key_products_ids):
    return write_to_pinboard(profile_id, key_products_ids, "one")


def new_contents_dict():
    contents_dict = {
        "one": [],
        "two": []
    }
    return contents_dict


def save_new_board(profile_id):
    contents = new_contents_dict()
    board = Pinboard(
        profile_id=profile_id,
        contents=contents)

    logger.info(u"saving board for {profile_id}: new contents: {contents}".format(
        profile_id=profile_id, contents=contents))

    return board

def write_to_pinboard(profile_id, list_of_pins, col):
    board = Pinboard.query.filter_by(profile_id=profile_id).first()
    if board:
        logger.info(u"saving board for {profile_id}: previous contents: {contents}".format(
            profile_id=profile_id, contents=board.contents))
        try:
            board.contents[col] = list_of_pins
        except TypeError:
            new_contents = new_contents_dict()
            new_contents[col] = list_of_pins
            board.contents = new_contents

        board.timestamp = datetime.datetime.utcnow()
    else:
        board = save_new_board(profile_id)
        board.contents[col] = list_of_pins

        logger.info(u"saving board for {profile_id}: new contents: {contents}".format(
            profile_id=profile_id, contents=board.contents))
    db.session.merge(board)
    commit(db)
    return board.contents


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


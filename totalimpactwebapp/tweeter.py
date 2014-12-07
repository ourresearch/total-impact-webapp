from totalimpactwebapp import json_sqlalchemy
from util import commit
from util import cached_property
from util import dict_from_dir
from totalimpactwebapp import db

from collections import defaultdict
import os
import datetime
import logging
logger = logging.getLogger('ti.tweeter')

class Tweeter(db.Model):
    screen_name = db.Column(db.Text, primary_key=True)
    followers = db.Column(db.Integer)
    name = db.Column(db.Text)
    description = db.Column(db.Text)
    image_url = db.Column(db.Text)
    last_collected_date = db.Column(db.DateTime())   #alter table tweeter add last_collected_date timestamp

    def __init__(self, **kwargs):
        if not "last_collected_date" in kwargs:
            self.last_collected_date = datetime.datetime.utcnow()
        super(Tweeter, self).__init__(**kwargs)


    def set_attributes_from_post(self, post):
        self.followers = post["author"].get("followers", 0)
        self.name = post["author"].get("name", self.screen_name)
        self.description = post["author"].get("description", "")
        self.image_url = post["author"].get("image", None)
        return self

    def __repr__(self):
        return u'<Tweeter {screen_name} {followers}>'.format(
            screen_name=self.screen_name, 
            followers=self.followers)

    def to_dict(self):
        attributes_to_ignore = [
            "tweet"
        ]
        ret = dict_from_dir(self, attributes_to_ignore)
        return ret
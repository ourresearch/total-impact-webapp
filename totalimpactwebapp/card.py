from totalimpactwebapp import db
import datetime
from flask import render_template


class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    card_type = db.Column(db.Text)  # readability, flags, new_metrics
    user_id = db.Column(db.Integer, unique=True)
    tiid = db.Column(db.Text, unique=True)
    granularity = db.Column(db.Text)  # profile or product
    metric = db.Column(db.Text)  # mendeley:views, scopus:citations
    weekly_diff = db.Column(db.Text)
    current_value = db.Column(db.Text)
    percentile_current_value = db.Column(db.Text)
    median = db.Column(db.Float)
    threshold_awarded = db.Column(db.Integer)
    num_profile_products_this_good = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime())
    weight = db.Column(db.Float)


    def __init__(self, **kwargs):
        self.timestamp = datetime.datetime.utcnow()
        super(Card, self).__init__(**kwargs)


    def to_dict(self):
        self_dict = self.__dict__
        ret = {}
        for k, v in self_dict.iteritems():
            if k.startswith("_"):
                pass

            else:
                try:
                    v = v.isoformat()
                except AttributeError:
                    pass

                ret[k] = v

        return ret


    def to_html(self):
        return render_template("card.html", self.to_dict())



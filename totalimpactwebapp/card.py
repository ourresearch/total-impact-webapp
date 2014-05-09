from totalimpactwebapp import db
import datetime
from flask import render_template

def ordinal(n):
    try:
        return "%d%s" % (n,"tsnrhtdd"[(n/10%10!=1)*(n%10<4)*n%10::4])
    except TypeError:
        return None

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    granularity = db.Column(db.Text)  # profile or product
    metric_name = db.Column(db.Text)  # mendeley:views, scopus:citations
    card_type = db.Column(db.Text)  # readability, flags, new_metrics
    user_id = db.Column(db.Integer)
    tiid = db.Column(db.Text)
    diff_value = db.Column(db.Text)
    current_value = db.Column(db.Text)
    percentile_current_value = db.Column(db.Text)
    median = db.Column(db.Float)
    threshold_awarded = db.Column(db.Integer)
    num_profile_products_this_good = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime())
    newest_diff_timestamp = db.Column(db.DateTime())
    oldest_diff_timestamp = db.Column(db.DateTime())
    diff_window_days = db.Column(db.Integer)
    weight = db.Column(db.Float)


    def __init__(self, **kwargs):
        if not "timestamp" in kwargs:
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

        ret["nth_profile_product_this_good"] = ordinal(self.num_profile_products_this_good)
        return ret

    def set_product_from_list(self, products):
        for product in products:
            if product["_id"] == self.tiid:
                self.product = product


    def to_html(self):
        return render_template(self.get_template_name() + ".html", **self.to_dict())

    def to_text(self):
        return render_template(self.get_template_name() + ".txt", **self.to_dict())

    def get_template_name(self):
        if self.threshold_awarded is not None:
            return "card-milestone"
        else:
            return "card-new-metric"

    def __repr__(self):
        return u'<Card {id} {user_id} {tiid} {granularity} {metric_name} {card_type}>'.format(
            id=self.id, user_id=self.user_id, tiid=self.tiid, granularity=self.granularity, metric_name=self.metric_name, card_type=self.card_type)


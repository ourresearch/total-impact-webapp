from totalimpactwebapp import db
from totalimpactwebapp import json_sqlalchemy
from totalimpactwebapp.metric import Metric

class Snap(db.Model):

    last_collected_date = db.Column(db.DateTime())
    raw_value = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))
    drilldown_url = db.Column(db.Text)
    number_times_collected = db.Column(db.Integer)
    first_collected_date = db.Column(db.DateTime())
    snap_id = db.Column(db.Text, primary_key=True)
    provider = db.Column(db.Text)
    interaction = db.Column(db.Text)

    # foreign keys
    tiid = db.Column(db.Text, db.ForeignKey("item.tiid"),)





    def __init__(self, **kwargs):
        super(Snap, self).__init__(**kwargs)

from totalimpactwebapp import db
from totalimpactwebapp import json_sqlalchemy


class Metric(db.Model):

    last_collected_date = db.Column(db.DateTime())
    raw_value = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))
    drilldown_url = db.Column(db.Text)
    number_times_collected = db.Column(db.Integer)
    first_collected_date = db.Column(db.DateTime())
    snap_id = db.Column(db.Text, primary_key=True)


    #metric_id = db.Column(db.Text, db.ForeignKey('metric2.metric_id'))



    def __init__(self, **kwargs):
        super(Metric, self).__init__(**kwargs)

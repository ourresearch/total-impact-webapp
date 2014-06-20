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

    # foreign keys
    provider = db.Column(db.Text)
    interaction = db.Column(db.Text)
    tiid = db.Column(db.Text)

    __table_args__ = (db.ForeignKeyConstraint(
        [provider, interaction, tiid],
        [Metric.provider, Metric.interaction, Metric.tiid]
    ), {})



    def __init__(self, **kwargs):
        super(Snap, self).__init__(**kwargs)

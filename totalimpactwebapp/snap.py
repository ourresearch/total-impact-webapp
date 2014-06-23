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


    def to_dict(self):
        return {
            "collected_date": self.last_collected_date,
            "value": self.raw_value,
            "drilldown_url": self.drilldown_url
        }

    @property
    def can_diff(self):
        try:
            _ = int(self.raw_value)
            return True
        except (ValueError, TypeError):
            return False

    @property
    def display_count(self):
        try:
            return int(self.raw_value)
        except ValueError:
            # deal with F1000's troublesome "count" of "Yes."
            # currently ALL strings are transformed to 1.
            return 1
        except TypeError:
            return 0  # ignore lists and dicts




class PercentileSnap(object):
    def __init__(self, snap, reference_set):
        self.snap = snap
        self.reference_set = reference_set

    @property
    def percentile(self):
        return self.reference_set.get_percentile(self.snap.raw_value)

    def is_highly(self):
        return True  # @todo replace with real value
    #    try:
    #        percentile_high_enough = self.percentiles["CI95_lower"] > 75
    #    except TypeError:  # no percentiles listed
    #        percentile_high_enough = False
    #
    #    raw_high_enough = self.display_count >= 3
    #
    #    if percentile_high_enough and raw_high_enough:
    #        return True
    #    else:
    #        return False

    def __getattr__(self, name):
        return getattr(self.snap, name)

    def to_dict(self):
        ret = self.snap.to_dict()
        self.reference_set.provider = self.snap.provider
        self.reference_set.interaction = self.snap.interaction

        ret["percentile"] = self.percentile
        return ret






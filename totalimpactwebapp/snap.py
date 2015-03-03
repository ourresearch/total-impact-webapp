from totalimpactwebapp import db
from util import cached_property
from util import ordinal
from totalimpactwebapp import json_sqlalchemy
import shortuuid
import datetime


def most_recent_posts_snap(tiid):
    snap = Snap.query \
        .filter(Snap.tiid==tiid, Snap.provider=='altmetric_com', Snap.interaction=='posts') \
        .order_by(Snap.last_collected_date.desc()).first()
    return snap


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
    tiid = db.Column(db.Text, db.ForeignKey("item.tiid"))



    def __init__(self, **kwargs):
        self.refset = None
        if not "last_collected_date" in kwargs:
            self.last_collected_date = datetime.datetime.utcnow()
        if not "first_collected_date" in kwargs:
            self.first_collected_date = datetime.datetime.utcnow()
        if not "snap_id" in kwargs:
            self.snap_id = shortuuid.uuid()
        if "query_type" in kwargs:
            self.query_type = kwargs["query_type"]
        super(Snap, self).__init__(**kwargs)


    def set_refset(self, refset):
        self.refset = refset


    @cached_property
    def raw_value_cleaned_for_export(self):
        PROVIDERS_WHO_DONT_ALLOW_EXPORT = ["scopus", "citeulike"]
        if self.provider in PROVIDERS_WHO_DONT_ALLOW_EXPORT:
            return "redacted"
        else:
            return self.raw_value


    def to_dict(self):
        return {
            "collected_date": self.last_collected_date,
            "provider": self.provider,
            "interaction": self.interaction,
            "value": self.raw_value,
            "drilldown_url": self.drilldown_url,
            "percentile": self.percentile
        }

    @cached_property
    def can_diff(self):
        try:
            _ = int(self.raw_value)
            return True
        except (ValueError, TypeError):
            return False

    @cached_property
    def display_count(self):
        # right now display as raw value int, may change in future
        return self.raw_value_int

    @cached_property
    def raw_value_int(self):
        try:
            return int(self.raw_value)
        except ValueError:
            # deal with F1000's troublesome "count" of "Yes."
            # currently ALL strings are transformed to 1.
            return 1
        except TypeError:
            return 0  # ignore lists and dicts

    @cached_property
    def percentile(self):
        try:
            return self.refset.get_percentile(
                self.provider,
                self.interaction,
                self.raw_value
            )
        except TypeError:
            return None

    @cached_property
    def percentile_value_string(self):
        try:
            return ordinal(self.percentile["value"])
        except TypeError:
            return None

    @cached_property
    def is_highly(self):
        try:
            percentile_high_enough = self.percentile["value"] >= 75
        except TypeError:  # no percentiles listed
            percentile_high_enough = False

        #min_count_for_highly
        raw_high_enough = self.display_count >= 3

        if percentile_high_enough and raw_high_enough:
            return True
        else:
            return False

    def __repr__(self):
        return u'<Snap {tiid} {provider} {interaction} {raw_value}>'.format(
            tiid=self.tiid, provider=self.provider, interaction=self.interaction, raw_value=self.raw_value)


class ZeroSnap(object):
    """
    Stub for the Metric object to use internally, when there's no real snap.
    """

    def __init__(self, date):
        self.last_collected_date = date
        self.raw_value_int = 0




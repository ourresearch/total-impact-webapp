from collections import Counter, namedtuple, defaultdict
import logging
import shortuuid
import datetime

from totalimpactwebapp.util import dict_from_dir
from totalimpactwebapp import json_sqlalchemy
from totalimpactwebapp import db

logger = logging.getLogger("tiwebapp.reference_set")


class ReferenceSet(object):
    def __init__(self):
        self.lookup_list = None

    def set_lookup_list(self, provider, interaction):
        global reference_set_lists
        lookup_key = ReferenceSetList.build_lookup_key(
            provider=provider, 
            interaction=interaction, 
            year=self.year, 
            genre=self.genre, 
            host=self.host, 
            mendeley_discipline=self.mendeley_discipline
            )
        try:
            self.lookup_list = reference_set_lists[lookup_key]
        except KeyError:
            return None


    def get_percentile(self, provider, interaction, raw_value):
        if not self.lookup_list:
            self.set_lookup_list(provider, interaction)

        if not self.lookup_list or not self.lookup_list.percentiles:
            return None

        percentile = 0
        percentile_step = 100.0/len(self.lookup_list.percentiles)
        for p in self.lookup_list.percentiles:
            if p > raw_value:
                break
            percentile += percentile_step

        return round(percentile, 0)


    def to_dict(self):
        attributes_to_ignore = [
            "refset"
        ]
        ret = dict_from_dir(self, attributes_to_ignore)
        return ret



class ReferenceSetList(db.Model):
    refset_id = db.Column(db.Text, primary_key=True)
    genre = db.Column(db.Text)
    host = db.Column(db.Text)
    year = db.Column(db.Text)
    mendeley_discipline = db.Column(db.Text)
    provider = db.Column(db.Text)
    interaction = db.Column(db.Text)
    created = db.Column(db.DateTime())
    percentiles = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))
    N = db.Column(db.Integer)

    def __init__(self, **kwargs):
        if not "refset_id" in kwargs:
            shortuuid.set_alphabet('abcdefghijklmnopqrstuvwxyz1234567890')
            self.refset_id = shortuuid.uuid()[0:24]

        if not "created" in kwargs:
            self.created = datetime.datetime.utcnow()
        super(ReferenceSetList, self).__init__(**kwargs)

    @classmethod
    def build_lookup_key(cls, year=None, genre=None, host=None, mendeley_discipline=None, provider=None, interaction=None):
        lookup_key = (
            year, 
            genre, 
            host, 
            mendeley_discipline,
            provider, 
            interaction, 
            )
        return lookup_key

    def get_lookup_key(self):
        return self.build_lookup_key(
            year=self.year, 
            genre=self.genre, 
            host=self.host, 
            mendeley_discipline=self.mendeley_discipline,
            provider=self.provider, 
            interaction=self.interaction, 
            )

    def get_percentile(self, raw_value):
        if not self.percentiles:
            return None

        for p in self.percentiles:
            if p >= raw_value:
                percentile = p
                break

        return percentile



class RefsetBuilder(object):
    def __init__(self):
        self.counters = defaultdict(Counter)

    @property
    def metric_keys(self):
        product_key_length = min([len(k) for k in self.counters.keys()])
        return [c for c in self.counters.keys() if len(c) > product_key_length]

    def product_key_from_metric_key(self, metric_key):
        product_key_length = min([len(k) for k in self.counters.keys()])
        return metric_key[0:product_key_length]

    def record_metric(self, metric_key, raw_value):
        self.counters[metric_key][raw_value] += 1

    def record_product(self, product_key):
        self.counters[product_key]["N_distinct_products"] += 1

    def most_common(self, metric_key, n=None):
        self.counters[metric_key].most_common(n)

    def percentiles(self, metric_key):
        product_key = self.product_key_from_metric_key(metric_key)

        # expand the accumulations
        elements = list(self.counters[metric_key].elements())
        n_non_zero = len(elements)
        n_total = self.counters[product_key]["N_distinct_products"]

        # zero pad for all metrics except for PLOS ALM views and downloads
        if ("plosalm" in metric_key) and (("pdf_views" in metric_key) or ("html_views" in metric_key)):
            n_zero = 0
            n_total = n_non_zero
        else:
            n_zero = n_total - n_non_zero
            if n_zero:
                elements += [0 for i in range(n_zero)]

        percentiles = None

        # decide the precision
        number_bins = None
        if n_total >= 100:
            number_bins = 100.0
        elif n_total > 25:
            number_bins = 10.0

        if number_bins:
            # find the cutoffs
            index_interval_size = int(round(len(elements)/number_bins))
            if index_interval_size > 0:
                percentiles = sorted(elements)[::index_interval_size]

        return {"percentiles": percentiles, "N": n_total}
           
    def metric_key_to_dict(self, metric_key):
        return dict(zip(("year", "genre", "host", "mendeley_discipline", "provider", "interaction"), metric_key))

    def export_histograms(self):
        refset_lists = []
        for metric_key in self.metric_keys:
            print metric_key, "=", self.percentiles(metric_key)
            new_refset_list = ReferenceSetList(**self.metric_key_to_dict(metric_key))
            new_refset_list.percentiles = self.percentiles(metric_key)["percentiles"]
            new_refset_list.N = self.percentiles(metric_key)["N"]
            refset_lists.append(new_refset_list)
        return(refset_lists)


def load_all_reference_set_lists():
    global reference_set_lists
    reference_set_lists = {}
    for refset_list_obj in db.session.query(ReferenceSetList).all():
        # we want it to persist across sessions, and is read-only, so detached from session works great
        db.session.expunge(refset_list_obj)
        lookup_key = refset_list_obj.get_lookup_key()
        reference_set_lists[lookup_key] = refset_list_obj
    print "just loaded reference sets, n=", len(reference_set_lists)
    return reference_set_lists

# load once
reference_set_lists = load_all_reference_set_lists()









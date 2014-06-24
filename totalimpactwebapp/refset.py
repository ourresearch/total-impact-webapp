from collections import Counter, namedtuple, defaultdict
import logging
import shortuuid
import datetime

from totalimpactwebapp.util import dict_from_dir
from totalimpactwebapp import db



logger = logging.getLogger("tiwebapp.refset")


class RefsetBuilder():
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
        elements += [0 for i in range(n_zero)]

        # decide the precision
        if n_total >= 100:
            number_bins = 100
        else:
            number_bins = 10

        # find the cutoffs
        index_interval_size = len(elements)/number_bins
        if index_interval_size > 0:
            percentiles = sorted(elements)[::index_interval_size]
        else:
            percentiles = None

        return {"percentiles": percentiles, "N": n_total}
           
    def metric_key_to_dict(self, metric_key):
        return dict(zip(("year", "genre", "host", "mendeley_discipline", "provider", "interaction"), metric_key))

    def export_histograms(self):
        refsets = []
        for metric_key in self.metric_keys:
            print metric_key, "=", self.percentiles(metric_key)
            new_refset = Refset(**self.metric_key_to_dict(metric_key))
            new_refset.percentiles = self.percentiles(metric_key)["percentiles"]
            new_refset.N = self.percentiles(metric_key)["N"]
            refsets.append(new_refset)
        return(refsets)



class Refset(db.Model):
    refset_id = db.Column(db.Text, primary_key=True)
    genre = db.Column(db.Text)
    host = db.Column(db.Text)
    year = db.Column(db.Text)
    mendeley_discipline = db.Column(db.Text)
    provider = db.Column(db.Text)
    interaction = db.Column(db.Text)
    created = db.Column(db.DateTime())
    percentiles = db.Column(db.Text)
    N = db.Column(db.Integer)

    def __init__(self, **kwargs):
        if not "refset_id" in kwargs:
            shortuuid.set_alphabet('abcdefghijklmnopqrstuvwxyz1234567890')
            self.refset_id = shortuuid.uuid()[0:24]

        if not "created" in kwargs:
            self.created = datetime.datetime.utcnow()
        super(Refset, self).__init__(**kwargs)

    def to_dict(self):
        attributes_to_ignore = [
            "refset"
        ]
        ret = dict_from_dir(self, attributes_to_ignore)
        return ret
















































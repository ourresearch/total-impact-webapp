from collections import Counter, namedtuple, defaultdict
import logging
import shortuuid
import datetime

from totalimpactwebapp.util import dict_from_dir
from totalimpactwebapp import db

logger = logging.getLogger("tiwebapp.reference_set")


class ReferenceSet(object):

    def get_percentile(self, provider, interaction, raw_value):
        return 50

    def to_dict(self):
        attributes_to_ignore = [
            "refset"
        ]
        ret = dict_from_dir(self, attributes_to_ignore)
        return ret


        #ret = {}
        #refsets_config = {
        #    "WoS": ["Web of Science", "indexed by"],
        #    "dryad": ["Dryad", "added to"],
        #    "figshare": ["figshare", "added to"],
        #    "github": ["GitHub", "added to"]
        #}
        #
        #for refset_key, normalized_values in self.values.iteritems():
        #    if refset_key == "raw":
        #        continue
        #    else:
        #        # This will arbitrarily pick on percentile reference set and
        #        # make it be the only one that counts. Works fine as long as
        #        # there is just one.
        #
        #        ret.update(normalized_values)
        #        ret["top_percent"] = 100 - normalized_values["CI95_lower"]
        #        ret["refset"] = refsets_config[refset_key][0]
        #        ret["refset_storage_verb"] = refsets_config[refset_key][1]
        #
        #if ret:
        #    return ret
        #else:
        #    return None



class ReferenceSetList(db.Model):
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
        super(ReferenceSetList, self).__init__(**kwargs)

    def get(self, provider, interaction, year, genre, host):
        return ReferenceSet()



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













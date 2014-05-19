import configs
import logging

logger = logging.getLogger("tiwebapp.metric_snap")


""" *****************************************
* Factory
***************************************** """



def make(raw_dict, metric_name, year, genre):
    snap = raw_dict
    snap["config"] = configs.metrics()[metric_name]

    raw_count = snap["values"]["raw"]
    snap["display_count"] = raw_count

    # deal with F1000's troublesome "count" of "Yes." Can add others later.
    # currently ALL strings are transformed to 1.
    if isinstance(raw_count, basestring):
        snap["actual_count"] = 1
    else:
        snap["actual_count"] = raw_count

    # handle plurals
    if snap["actual_count"] <= 1:
        snap["display_interaction"] = snap["config"]["interaction"][:-1]  # de-pluralize

    # add product-level info
    snap["refset_year"] = year
    snap["refset_genre"] = genre

    snap.update(metric_percentiles(snap))
    return MetricSnap(metric_name, snap)








def metric_percentiles(metric):
    ret = {}
    refsets_config = {
        "WoS": ["Web of Science", "indexed by"],
        "dryad": ["Dryad", "added to"],
        "figshare": ["figshare", "added to"],
        "github": ["GitHub", "added to"]
    }

    for refset_key, normalized_values in metric["values"].iteritems():
        if refset_key == "raw":
            continue
        else:
            # This will arbitrarily pick on percentile reference set and
            # make it be the only one that counts. Works fine as long as
            # there is just one.

            ret["percentiles"] = normalized_values
            ret["top_percent"] = 100 - normalized_values["CI95_lower"]
            ret["refset"] = refsets_config[refset_key][0]
            ret["refset_storage_verb"] = refsets_config[refset_key][1]

    return ret
















class MetricSnap():
    def __init__(self, metric_name, metric_snap_dict):
        del metric_snap_dict["static_meta"]

        self.metric_snap_dict = metric_snap_dict
        self.metric_name = metric_name


    def is_highly(self):
        pass

    def to_dict(self, include_config=False):
        ret = self.metric_snap_dict
        if not include_config:
            del ret["config"]

        return ret
















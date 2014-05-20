import configs
import logging

logger = logging.getLogger("tiwebapp.metric_snap")




def make(raw_dict, metric_name):
    return Metric(raw_dict, metric_name)






class Metric():
    def __init__(self, raw_dict, metric_name):
        del raw_dict["static_meta"]

        self.config = configs.metrics()[metric_name]
        self.raw_dict = raw_dict
        self.metric_name = metric_name

    @property
    def is_highly(self):
        try:
            percentile_high_enough = self.raw_dict["percentiles"]["CI95_lower"] > 75
            raw_high_enough = self.raw_dict["actual_count"] >= 3

            if percentile_high_enough and raw_high_enough:
                return True
            else:
                return False

        except KeyError:  # no percentiles listed
            return False

    def to_dict(self, genre, year):
        ret = self.raw_dict
        ret["is_highly"] = self.is_highly
        ret.update(self.get_percentiles(ret))


        raw_count = ret["values"]["raw"]
        ret["display_count"] = raw_count

        # deal with F1000's troublesome "count" of "Yes." Can add others later.
        # currently ALL strings are transformed to 1.
        if isinstance(raw_count, basestring):
            ret["actual_count"] = 1
        else:
            ret["actual_count"] = raw_count

        # handle plurals
        if ret["actual_count"] <= 1:
            ret["display_interaction"] = ret["config"]["interaction"][:-1]  # de-pluralize

        # add product-level info
        ret["refset_year"] = year
        ret["refset_genre"] = genre


        return ret



    def get_percentiles(self, metric_dict):
        ret = {}
        refsets_config = {
            "WoS": ["Web of Science", "indexed by"],
            "dryad": ["Dryad", "added to"],
            "figshare": ["figshare", "added to"],
            "github": ["GitHub", "added to"]
        }

        for refset_key, normalized_values in metric_dict["values"].iteritems():
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















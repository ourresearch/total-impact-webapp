import configs
import logging
from totalimpactwebapp import util

logger = logging.getLogger("tiwebapp.metric_snap")




def make(raw_dict, metric_name):
    return Metric(raw_dict, metric_name)






class Metric():
    def __init__(self, raw_dict, metric_name):

        self.config = configs.metrics()[metric_name]
        self.metric_name = metric_name

        # temporary for until we get this from the db via sqlalchemy
        del raw_dict["static_meta"]
        for k, v in raw_dict.iteritems():
            setattr(self, k, v)

    @property
    def is_highly(self):
        try:
            percentile_high_enough = self.percentiles["CI95_lower"] > 75
        except TypeError:  # no percentiles listed
            percentile_high_enough = False

        raw_high_enough = self.display_count >= 3

        if percentile_high_enough and raw_high_enough:
            return True
        else:
            return False


    @property
    def has_new_metric(self):
        return self.historical_values["diff"]["raw"] > 0


    @property
    def latest_nonzero_refresh_timestamp(self):
        try:
            return self.historical_values["current"]["collected_date"]
        except KeyError:
            return None

    @property
    def engagement_type(self):
        return self.config["engagement_type"]


    @property
    def audience(self):
        return self.config["audience"]

    @property
    def provider_name(self):
        return self.metric_name.split(":")[0]

    @property
    def interaction(self):
        return self.metric_name.split(":")[1]

    @property
    def display_count(self):
        try:
            return int(self.values["raw"])
        except ValueError:
            # deal with F1000's troublesome "count" of "Yes."
            # currently ALL strings are transformed to 1.
            return 1
        except TypeError:
            return 0  # ignore lists and dicts

    @property
    def display_interaction(self):
        if self.display_count <= 1:
            return self.config["interaction"][:-1]  # de-pluralize
        else:
            return self.config["interaction"]

    @property
    def top_percentile(self):
        try:
            return self.percentiles["CI95_upper"]
        except TypeError:
            return None

    @property
    def percentiles(self):
        ret = {}
        refsets_config = {
            "WoS": ["Web of Science", "indexed by"],
            "dryad": ["Dryad", "added to"],
            "figshare": ["figshare", "added to"],
            "github": ["GitHub", "added to"]
        }

        for refset_key, normalized_values in self.values.iteritems():
            if refset_key == "raw":
                continue
            else:
                # This will arbitrarily pick on percentile reference set and
                # make it be the only one that counts. Works fine as long as
                # there is just one.

                ret.update(normalized_values)
                ret["top_percent"] = 100 - normalized_values["CI95_lower"]
                ret["refset"] = refsets_config[refset_key][0]
                ret["refset_storage_verb"] = refsets_config[refset_key][1]

        if ret:
            return ret
        else:
            return None

    def to_dict(self):
        ret = util.dict_from_dir(self, "config")
        return ret














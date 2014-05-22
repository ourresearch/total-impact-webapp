import configs
import logging

logger = logging.getLogger("tiwebapp.metric_snap")




def make(raw_dict, metric_name):
    return Metric(raw_dict, metric_name)






class Metric():
    def __init__(self, raw_dict, metric_name):

        self.config = configs.metrics()[metric_name]
        self.metric_name = metric_name

        # temporary for until we get this from the db via sqlalchemy
        del raw_dict["static_meta"]
        self.raw_dict = raw_dict
        for k, v in raw_dict.iteritems():
            setattr(self, k, v)


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
    def actual_count(self):
        # deal with F1000's troublesome "count" of "Yes." Can add others later.
        # currently ALL strings are transformed to 1.
        if isinstance(self.raw_dict["values"]["raw"], basestring):
            return 1
        else:
            return self.raw_dict["values"]["raw"]

    @property
    def display_count(self):
        return self.raw_dict["values"]["raw"]

    @property
    def display_interaction(self):
        if self.actual_count <= 1:
            return self.config["interaction"][:-1]  # de-pluralize
        else:
            return self.config["interaction"]

    def to_dict(self):
        return self.__dict__



    @property
    def percentiles(self, metric_dict):
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

                ret["values"] = normalized_values
                ret["top_percent"] = 100 - normalized_values["CI95_lower"]
                ret["refset"] = refsets_config[refset_key][0]
                ret["refset_storage_verb"] = refsets_config[refset_key][1]

        return ret















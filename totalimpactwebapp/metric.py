import configs
import logging
from totalimpactwebapp import util
import arrow


logger = logging.getLogger("tiwebapp.metric")
utc_now = arrow.utcnow()


def make(raw_dict, metric_name):
    return Metric(raw_dict, metric_name)


class Metric(object):


    def __init__(self, **kwargs):
        pass



    @property
    def config(self):
        fully_qualified_metric_name = self.provider + ":" + self.interaction
        return configs.metrics()[fully_qualified_metric_name]

    @property
    def most_recent_snap(self):
        try:
            return sorted(
                self.snaps,
                key=lambda x: x.last_collected_date,
                reverse=True
            )[0]
        except IndexError:
            return None

    #@property
    #def is_highly(self):
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
    #
    #
    #@property
    #def display_order(self):
    #    # this mostly duplicates this same method in the Award object.
    #    # that ain't great. but not sure how else to sort metrics on the
    #    # product page...can figure out something better if it becomes a prob.
    #    ret = configs.award_configs["engagement_types"][self.engagement_type][1]
    #    if self.audience == "scholars":
    #        ret += 10
    #
    #    if self.is_highly:
    #        ret += 100
    #
    #    return ret
    #

    @property
    def has_new_metric(self):
        #return self.historical_values["diff"]["raw"] > 0
        return False  # @todo return actual value

    @property
    def hide_badge(self):
        try:
            return self.config["hide_badge"]
        except KeyError:
            return False

    @property
    def latest_nonzero_refresh_timestamp(self):
        try:
            return self.most_recent_snap.last_collected_date
        except AttributeError:
            return None


    @property
    def engagement_type(self):
        return self.config["engagement_type"]


    @property
    def audience(self):
        return self.config["audience"]

    @property
    def provider_name(self):  # for backward compatibility
        return self.provider


    @property
    def display_count(self):
        return 42
        try:
            return int(self.most_recent_snap.raw_value)
        except ValueError:
            # deal with F1000's troublesome "count" of "Yes."
            # currently ALL strings are transformed to 1.
            return 1
        except TypeError:
            return 0  # ignore lists and dicts


    @property
    def display_provider(self):
        try:
            ret = self.config["display_provider"]
        except KeyError:
            ret = self.config["provider_name"].capitalize()

        ret.replace("Figshare", "figshare")  # hack
        return ret


    @property
    def display_interaction(self):
        if self.display_count <= 1:
            return self.config["interaction"][:-1]  # de-pluralize
        else:
            return self.config["interaction"]


    #@property
    #def top_percentile(self):
    #    try:
    #        return self.percentiles["CI95_upper"]
    #    except TypeError:
    #        return None


    #@property
    #def percentiles(self):
    #    ret = {}
    #    refsets_config = {
    #        "WoS": ["Web of Science", "indexed by"],
    #        "dryad": ["Dryad", "added to"],
    #        "figshare": ["figshare", "added to"],
    #        "github": ["GitHub", "added to"]
    #    }
    #
    #    for refset_key, normalized_values in self.values.iteritems():
    #        if refset_key == "raw":
    #            continue
    #        else:
    #            # This will arbitrarily pick on percentile reference set and
    #            # make it be the only one that counts. Works fine as long as
    #            # there is just one.
    #
    #            ret.update(normalized_values)
    #            ret["top_percent"] = 100 - normalized_values["CI95_lower"]
    #            ret["refset"] = refsets_config[refset_key][0]
    #            ret["refset_storage_verb"] = refsets_config[refset_key][1]
    #
    #    if ret:
    #        return ret
    #    else:
    #        return None
    #

    def to_dict(self):
        ret = util.dict_from_dir(self, ["config", "item"])
        return ret














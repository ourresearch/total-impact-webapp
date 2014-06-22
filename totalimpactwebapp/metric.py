import configs
import logging
from totalimpactwebapp import util
import arrow


logger = logging.getLogger("tiwebapp.metric")
utc_now = arrow.utcnow()


#def make(raw_dict, metric_name):
#    return Metric(raw_dict, metric_name)


def make_metrics_list(product):
    metrics = []
    for fully_qualified_metric_name, my_config in configs.metrics().iteritems():
        my_provider, my_interaction = fully_qualified_metric_name.split(":")
        my_metric = make_single_metric(my_provider, my_interaction, my_config)
        my_metric.add_snaps_from_list(product.snaps)

        if len(my_metric.snaps):
            metrics.append(my_metric)

    return metrics


def make_single_metric(provider, interaction, config):
    if provider == "mendeley" and interaction == "discipline":
        return MendeleyDisciplineMetric(provider, interaction, config)
    else:
        return Metric(provider, interaction, config)



class Metric(object):

    def __init__(self, provider, interaction, config):
        self.provider = provider
        self.interaction = interaction
        self.snaps = []
        self.config = config
        self.diff = {}


    def add_snaps_from_list(self, snaps_list):
        for snap in snaps_list:
            self.add_snap(snap)


    def add_snap(self, snap):
        if snap.provider == self.provider and snap.interaction == self.interaction:
            self.snaps.append(snap)
            return True
        else:
            return False
        

    @property
    def most_recent_snap(self):
        return sorted(
            self.snaps,
            key=lambda x: x.last_collected_date,
            reverse=True
        )[0]

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

    def get_window_start_snap(self, window_must_start_after):
        most_recent_snap_time = arrow.get(self.most_recent_snap.last_collected_date)
        window_starts_right_before = most_recent_snap_time.replace(days=-7)
        sorted_snaps = sorted(
            self.snaps,
            key=lambda x: x.last_collected_date,
            reverse=True
        )

        for snap in sorted_snaps:
            my_snap_time = arrow.get(snap.last_collected_date)
            if window_must_start_after < my_snap_time < window_starts_right_before:
                return snap

        return None

    def set_diff(self, window_must_start_after):
        window_start_snap = self.get_window_start_snap(window_must_start_after)
        if window_start_snap is None:
            return None
        else:
            diff_value = "foo"




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
        return self.most_recent_snap.last_collected_date


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
        return self.most_recent_snap.display_count


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
        ret = util.dict_from_dir(self, ["config", "snaps"])
        return ret




class MendeleyDisciplineMetric(Metric):

    def __init__(self, *args):
        super(MendeleyDisciplineMetric, self).__init__(*args)

    @property
    def mendeley_discipine(self):
        disciplines = self.most_recent_snap.raw_value

        by_name = sorted(disciplines, key=lambda d: d["name"])
        by_value_then_name = sorted(
            by_name,
            key=lambda d: d["value"],
            reverse=True
        )
        return by_value_then_name[0]







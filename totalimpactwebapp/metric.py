import configs
import logging
import arrow
from totalimpactwebapp import util


logger = logging.getLogger("tiwebapp.metric")
utc_now = arrow.utcnow()




def make_metrics_list(snaps, product_created):
    metrics = []

    for fully_qualified_metric_name, my_config in configs.metrics().iteritems():
        my_provider, my_interaction = fully_qualified_metric_name.split(":")

        my_metric = Metric(
            my_provider,
            my_interaction,
            my_config)

        my_metric.add_snaps_from_list(snaps)

        my_metric.diff_window_must_start_after = arrow.get(product_created)

        if len(my_metric.snaps):
            metrics.append(my_metric)

    return metrics



def make_mendeley_metric(snaps, product_created):
    metric = MendeleyDisciplineMetric(
        "mendeley",
        "discipline",
        configs.metrics()["mendeley:discipline"]
    )
    metric.add_snaps_from_list(snaps)
    metric.diff_window_must_start_after = arrow.get(product_created)

    if len(metric.snaps):
        return metric
    else:
        return None



class Metric(object):

    def __init__(self, provider, interaction, config):
        self.provider = provider
        self.interaction = interaction
        self.snaps = []
        self.config = config
        self.diff_window_must_start_after = None


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

    @property
    def is_highly(self):
        return self.most_recent_snap.is_highly

    @property
    def fully_qualified_metric_name(self):
        return u"{provider}:{interaction}".format(
            provider=self.provider, interaction=self.interaction)


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


    def _diff(self):
        window_start_snap = self.get_window_start_snap(
            self.diff_window_must_start_after
        )
        if window_start_snap is None:
            return {
                "window_length": None,
                "value": None
            }
        else:
            window_start = arrow.get(window_start_snap.last_collected_date)
            window_end = arrow.get(self.most_recent_snap.last_collected_date)
            window_length_timedelta = window_end - window_start

            try:
                value_diff = self.most_recent_snap.raw_value - window_start_snap.raw_value
            except TypeError:
                # complex values like mendeley discipline dicts
                value_diff = None

            return {
                "window_length": window_length_timedelta.days,
                "value": value_diff
            }

    @property
    def diff_value(self):
        return self._diff()["value"]

    @property
    def diff_window_length(self):
        return self._diff()["window_length"]


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

    @property
    def percentile(self):
        return self.most_recent_snap.percentile

    @property
    def percentile_string(self):
        return self.most_recent_snap.percentile_string

    @property
    def display_order(self):
        try:
            ret = self.most_recent_snap.raw_value + 0
        except TypeError:
            ret = 0


        if self.audience == "scholars":
            ret += 10

        if self.is_highly:
            ret += 100

        return ret

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







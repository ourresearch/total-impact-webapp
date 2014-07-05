import configs
import logging
import arrow
from totalimpactwebapp.util import cached_property
from totalimpactwebapp.util import dict_from_dir


logger = logging.getLogger("tiwebapp.metric")
utc_now = arrow.utcnow()




def make_metrics_list(snaps, product_created):
    metrics = []

    for fully_qualified_metric_name, my_config in configs.metrics().iteritems():
        my_provider, my_interaction = fully_qualified_metric_name.split(":")

        if Metric.test(my_provider, my_interaction, snaps):

            my_metric = Metric(
                my_provider,
                my_interaction,
                my_config)

            my_metric.add_snaps_from_list(snaps)

            my_metric.diff_window_must_start_after = arrow.get(product_created)
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

    @classmethod
    def test(cls, provider, interaction, snaps):
        for snap in snaps:
            if snap.provider == provider and snap.interaction == interaction:
                return True

        return False
        

    @cached_property
    def most_recent_snap(self):
        return sorted(
            self.snaps,
            key=lambda x: x.last_collected_date,
            reverse=True
        )[0]

    @cached_property
    def window_start_snap(self):
        return self.get_window_start_snap(self.diff_window_must_start_after)

    @cached_property
    def is_highly(self):
        return self.most_recent_snap.is_highly

    @cached_property
    def fully_qualified_metric_name(self):
        return u"{provider}:{interaction}".format(
            provider=self.provider, interaction=self.interaction)

    @cached_property
    def can_diff(self):
        return self.most_recent_snap.can_diff

    @cached_property
    def milestone_just_reached(self):
        if not self.can_diff:
            return None

        for milestone in sorted(self.config["milestones"], reverse=True):
            if self.window_start_snap.raw_value_int < milestone <= self.most_recent_snap.raw_value_int:
                return milestone

        return None

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
        if self.window_start_snap is None or not self.can_diff:
            return {
                "window_length": None,
                "value": None
            }
        else:
            window_start = arrow.get(self.window_start_snap.last_collected_date)
            window_end = arrow.get(self.most_recent_snap.last_collected_date)
            window_length_timedelta = window_end - window_start

            try:
                value_diff = self.most_recent_snap.raw_value - self.window_start_snap.raw_value
            except TypeError:
                # complex values like mendeley discipline dicts
                value_diff = None

            return {
                "window_length": window_length_timedelta.days,
                "value": value_diff
            }

    @cached_property
    def diff_value(self):
        return self._diff()["value"]

    @cached_property
    def diff_window_length(self):
        return self._diff()["window_length"]


    @cached_property
    def hide_badge(self):
        try:
            return self.config["hide_badge"]
        except KeyError:
            return False

    @cached_property
    def latest_nonzero_refresh_timestamp(self):
        return self.most_recent_snap.last_collected_date


    @cached_property
    def engagement_type(self):
        return self.config["engagement_type"]


    @cached_property
    def audience(self):
        return self.config["audience"]

    @cached_property
    def provider_name(self):  # for backward compatibility
        return self.provider


    @cached_property
    def display_count(self):
        return self.most_recent_snap.display_count


    @cached_property
    def display_provider(self):
        try:
            ret = self.config["display_provider"]
        except KeyError:
            ret = self.config["provider_name"].capitalize()

        ret.replace("Figshare", "figshare")  # hack
        return ret

    @cached_property
    def display_interaction(self):
        if self.display_count <= 1:
            return self.config["interaction"][:-1]  # de-pluralize
        else:
            return self.config["interaction"]

    @cached_property
    def drilldown_url(self):
        return self.most_recent_snap.drilldown_url

    @cached_property
    def percentile(self):
        return self.most_recent_snap.percentile

    @cached_property
    def percentile_value_string(self):
        return self.most_recent_snap.percentile_value_string

    @cached_property
    def display_order(self):
        try:
            ret = self.most_recent_snap.raw_value + 0  # just for tiebreaks
        except TypeError:
            ret = 0


        if self.audience == "scholars":
            ret += 100000  # big numbers to overcome high downloads

        if self.is_highly:
            ret += 100000000

        return ret

    def to_dict(self):
        ret = dict_from_dir(self, ["config", "snaps"])
        return ret




class MendeleyDisciplineMetric(Metric):

    def __init__(self, *args):
        super(MendeleyDisciplineMetric, self).__init__(*args)

    @cached_property
    def mendeley_discipine(self):
        disciplines = self.most_recent_snap.raw_value

        by_name = sorted(disciplines, key=lambda d: d["name"])
        by_value_then_name = sorted(
            by_name,
            key=lambda d: d["value"],
            reverse=True
        )
        return by_value_then_name[0]







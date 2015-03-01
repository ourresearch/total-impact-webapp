import configs
import logging
import arrow
import math
from util import cached_property
from util import dict_from_dir
from totalimpactwebapp.snap import ZeroSnap


logger = logging.getLogger("tiwebapp.metric")
utc_now = arrow.utcnow()




def make_metrics_list(tiid, snaps, product_created):
    metrics = []

    for fully_qualified_metric_name, my_config in configs.metrics().iteritems():

        my_provider, my_interaction = fully_qualified_metric_name.split(":")

        if Metric.would_make_a_metric(my_provider, my_interaction, snaps):

            my_metric = Metric(
                tiid,
                my_provider,
                my_interaction,
                my_config)

            my_metric.add_snaps_from_list(snaps)

            my_metric.product_create_date = arrow.get(product_created, 'UTC')
            metrics.append(my_metric)

    return metrics



class Metric(object):

    window_start_min_days_ago = 8
    product_min_age_for_diff_minutes = 60*6  # 6 hrs
    assume_we_have_first_snap_by_minutes = 60*6  # 6hrs

    def __init__(self, tiid, provider, interaction, config):
        self.tiid = tiid
        self.provider = provider
        self.interaction = interaction
        self.snaps = []
        self.config = config
        self.product_create_date = None


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
    def would_make_a_metric(cls, provider, interaction, snaps):
        for snap in snaps:
            if snap.provider == provider and snap.interaction == interaction:
                return True

        return False
        

    # useful for debugging
    # @cached_property
    # def all_snaps_oldest_to_youngest(self):
    #     return sorted(
    #         self.snaps,
    #         key=lambda x: x.last_collected_date,
    #         reverse=False
    #     )


    @cached_property
    def most_recent_snap(self):
        return sorted(
            self.snaps,
            key=lambda x: x.last_collected_date,
            reverse=True
        )[0]


    @cached_property
    def oldest_snap(self):
        return sorted(
            self.snaps,
            key=lambda x: x.last_collected_date,
            reverse=False
        )[0]


    @cached_property
    def is_highly(self):
        return self.most_recent_snap.is_highly

    @cached_property
    def fully_qualified_metric_name(self):
        return u"{provider}:{interaction}".format(
            provider=self.provider, interaction=self.interaction)

    @cached_property
    def is_account(self):
        return self.config.get("is_account", False)

    @cached_property
    def can_diff(self):
        return self.most_recent_snap.can_diff and self.diff_window_start_value is not None

    @cached_property
    def milestone_just_reached(self):
        if not self.can_diff:
            return None

        if not self.diff_value:
            return None

        for milestone in sorted(self.config["milestones"], reverse=True):
            if self.diff_window_start_value < milestone <= self.diff_window_end_value:
                return milestone

        return None

    @cached_property
    def _window_start_snap(self):
        most_recent_snap_time = arrow.get(self.most_recent_snap.last_collected_date, 'UTC')
        window_start_time = arrow.utcnow().replace(days=-self.window_start_min_days_ago)

        # all our data is super old
        if most_recent_snap_time < window_start_time:
            return None

        min_for_diff = self.product_create_date.replace(
            minutes=self.product_min_age_for_diff_minutes)

        # we're currently in the first minutes of this product's life
        if arrow.utcnow() < min_for_diff:
            return None

        # we first introduced this metric less than a week ago: then no diff.
        if ("metric_debut_date" in self.config):
            metric_debut_time = arrow.get(self.config["metric_debut_date"], 'UTC')
            if metric_debut_time >= window_start_time:
                return self.oldest_snap

         # it's a newish product, but we can get get diffs still
        if self.product_create_date > window_start_time:
            oldest_snap_date = arrow.get(self.oldest_snap.last_collected_date, 'UTC')
            earliest_valid_snap_time = self.product_create_date.replace(minutes=self.assume_we_have_first_snap_by_minutes)
            if earliest_valid_snap_time < oldest_snap_date:
                # we could've got an earlier snap but didn't, so assume we tried and got 0
                return ZeroSnap(self.product_create_date.datetime)
            else:
                return self.oldest_snap

         # this is a product we've had for a while, we've (hopefully)
         # done multiple updates
        else:
            newest_snap_older_than_window = None
            sorted_snaps = sorted(
                self.snaps,
                key=lambda x: x.last_collected_date,
                reverse=True
            )

            for snap in sorted_snaps:
                my_snap_time = arrow.get(snap.last_collected_date, 'UTC')
                if my_snap_time < window_start_time:
                    newest_snap_older_than_window = snap
                    break

            if newest_snap_older_than_window:
                return newest_snap_older_than_window
            else:
                snap_to_return = ZeroSnap(self.product_create_date.datetime)
                return snap_to_return



    @cached_property
    def diff_window_start_value(self):
        try:
            return self._window_start_snap.raw_value_int
        except AttributeError:  # there is no window start snap
            return None

    @cached_property
    def diff_window_start_date(self):
        try:
            return self._window_start_snap.last_collected_date
        except AttributeError:  # there is no window start snap
            return None

    @cached_property
    def diff_window_end_value(self):
        return self.most_recent_snap.raw_value_int

    @cached_property
    def diff_window_end_date(self):
        return self.most_recent_snap.last_collected_date

    @cached_property
    def current_value(self):
        return self.diff_window_end_value


    @cached_property
    def is_int(self):
        try:
            _ = int(self.most_recent_snap.raw_value)
            return True
        except (ValueError, TypeError):
            return False

    @cached_property
    def diff_value(self):
        diff_value = self.diff_value_unadjusted
        if diff_value:
            # should never happen, but might if updates get badly stuck :(
            # don't claim any weekly diff, because we have no idea if new stuff is new
            if self.diff_window_length_days > 30:  
                diff_value = 0

            # should also never happen, but might sometimes
            elif self.diff_window_length_days > 8:
                diff_value = int(math.ceil(diff_value / (self.diff_window_length_days / 7.0)))
        return diff_value

    @cached_property
    def diff_value_unadjusted(self):
        try:
            diff_value = self.diff_window_end_value - self.diff_window_start_value
            return diff_value
        except TypeError:
            return None

    @cached_property
    def diff_window_length_days(self):
        if self.diff_window_start_date and self.diff_window_end_date:
            diff_window_start_date = arrow.get(self.diff_window_start_date)
            diff_window_end_date = arrow.get(self.diff_window_end_date)
            try:
                time_diff = diff_window_end_date - diff_window_start_date
                return time_diff.days
            except TypeError:
                return None
        return None

    @cached_property
    def hide_badge(self):
        try:
            return self.config["hide_badge"]
        except KeyError:
            return False

    @cached_property
    def latest_nonzero_refresh_timestamp(self):
        # print self.tiid, most_recent_snap.last_collected_date
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
            ret = self.config["provider_name"]

        return ret

    @cached_property
    def display_interaction(self):
        if self.display_count <= 1:
            return self.config["display_interaction"][:-1]  # de-pluralize
        else:
            return self.config["display_interaction"]

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
            ret = self.most_recent_snap.raw_value_int + 0  # just for tiebreaks
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








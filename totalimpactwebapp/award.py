from util import cached_property
from util import dict_from_dir

import logging
import configs

logger = logging.getLogger("ti.award")



def make_list(metrics):
    """
    Factory to make a list of Award objects from a list of Metric objects.
    """
    awards = []
    for engagement_type in configs.award_configs["engagement_types"].keys():
        for audience in configs.award_configs["audiences"].keys():
            this_award = Award(engagement_type, audience, metrics)
            if len(this_award.metrics):
                awards.append(this_award)

    return awards









class Award(object):
    def __init__(self, engagement_type, audience, metrics):
        self.engagement_type = engagement_type
        self.audience = audience

        self.metrics = []
        for metric in metrics:
            self.add_metric(metric)

    def add_metric(self, metric):
        same_audience = metric.audience == self.audience
        same_engagement_type = metric.engagement_type == self.engagement_type

        if same_audience and same_engagement_type and not metric.hide_badge:
            self.metrics.append(metric)
            return True
        else:
            return False

    @cached_property
    def is_highly(self):
        return self.top_metric_by_percentile.is_highly


    @cached_property
    def top_metric_by_percentile(self):
        s = sorted(self.metrics, key=lambda metric: metric.percentile, reverse=True)
        return s[0]

    @cached_property
    def top_metric_by_count(self):
        s = sorted(self.metrics, key=lambda metric: metric.display_count, reverse=True)
        return s[0]

    @cached_property
    def top_metric_by_diff(self):
        s = sorted(
            self.metrics,
            key=lambda metric: metric.diff_value,
            reverse=True
        )
        return s[0]

    @cached_property
    def metrics_with_diff(self):
        return [m for m in self.metrics if m.diff_value > 0]

    @cached_property
    def has_diff(self):
        return len(self.metrics_with_diff) > 0

    @cached_property
    def is_highly_classname(self):
        if self.is_highly:
            return "is-highly"
        else:
            return "is-not-highly"

    @cached_property
    def highly_string(self):
        if self.is_highly:
            return "highly"
        else:
            return ""

    @cached_property
    def sort_score(self):
        if self.is_highly:
            return 3
        else:
            return 1

    @cached_property
    def display_audience(self):
        return self.audience.replace("public", "the public")

    @cached_property
    def display_order(self):
        ret = configs.award_configs["engagement_types"][self.engagement_type][1]
        if self.audience == "scholars":
            ret += 10

        if self.is_highly:
            ret += 100

        return ret

    def to_dict(self):
        return dict_from_dir(self)















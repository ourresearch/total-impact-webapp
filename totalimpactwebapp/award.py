from copy import deepcopy
import logging

import configs

logger = logging.getLogger("tiwebapp.metric_snap")



def awards_list(metrics):
    """
    Factory to make a list of Award objects from a list of Metric objects
    """
    my_list = []
    for engagement_type in configs.award_configs["engagement_types"].keys():
        for audience in configs.award_configs["audiences"].keys():
            this_award = Award(engagement_type, audience, metrics)
            if len(this_award.metrics):
                my_list.append(this_award)

    return my_list










class Award():
    def __init__(self, engagement_type, audience, metrics):
        self.engagement_type = engagement_type
        self.audience = audience

        self.metrics = []
        for metric in metrics:
            self.add_metric(metric)

    def add_metric(self, metric):
        same_audience = metric.audience == self.audience
        same_engagement_type = metric.engagement_type == self.engagement_type

        if same_audience and same_engagement_type:
            self.metrics.append(metric)
            return True
        else:
            return False

    @property
    def is_highly(self):
        return True

    @property
    def sort_score(self):
        if self.is_highly:
            return 3
        else:
            return 1


    def to_dict(self):
        return {
            "audience": self.audience,
            "engagement_type": self.engagement_type,
            "num_metrics": len(self.metrics),
            "other cool stuff": "yes please"
        }







class AwardsList():
    def __init__(self, metrics):
        self.metrics = metrics

    def make_list(self):
        my_list = []
        for engagement_type in configs.award_configs["engagement_types"].keys():
            for audience in configs.award_configs["audiences"].keys():
                this_award = Award(engagement_type, audience, self.metrics)
                my_list.append(this_award)

        return my_list

    def to_list(self):
        ret = []

        for award in self.make_list():
            if len(award.metrics):
                ret.append(award.to_dict())

        return ret













from copy import deepcopy
import logging

import configs

logger = logging.getLogger("tiwebapp.metric_snap")


""" *****************************************
* Factory
***************************************** """

def awards_list(metrics):
    my_list = []
    for engagement_type in configs.award_configs["engagement_types"].keys():
        for audience in configs.award_configs["audiences"].keys():
            this_award = Award(engagement_type, audience, metrics)
            if len(this_award.metrics):
                my_list.append(this_award)


    return my_list








def make_awards_old(product):
    metrics = product["metrics"]
    awards_dict = {}

    for metric_name, metric in metrics.iteritems():
        this_award = deepcopy(metric["award"])
        this_award["metrics"] = [metric]
        this_award_key = (this_award["audience"], this_award["engagement_type"])
        this_award["top_metric"] = None

        if this_award_key in awards_dict:
            # we've got this award. add to its metrics
            awards_dict[this_award_key]["metrics"].append(metric)

        else:
            awards_dict[this_award_key] = this_award

    for k, award in awards_dict.iteritems():
        award["top_metric"] = get_top_metric(award["metrics"])


        # this is a horrible hack on top of more horrible hacks. i understand
        # neither why we need it nor how it works...this whole awards/metric
        # logic is ghastly.
        if award["top_metric"]["award"]["is_highly"]:
            award["is_highly"] = True
            award["is_highly_classname"] = "is-highly"
            award["highly_string"] = "highly"
        else:
            award["is_highly"] = False
            award["is_highly_classname"] = "is-not-highly"
            award["highly_string"] = ""


    return awards_dict.values()


def get_top_metric(metrics):

    max_actual_count = max([m["actual_count"] for m in metrics])

    def sort_key(m):
        try:
            raw_count_contribution = m["actual_count"] / max_actual_count
            raw_count_contribution -= .0001  # always <1
        except TypeError:  # dealing with a dict from mendeley reader breakdown.
            raw_count_contribution = .5

        try:
            return m["percentiles"]["CI95_lower"] + raw_count_contribution
        except KeyError:
            return raw_count_contribution

    sorted_by_metric_percentile_then_raw_counts = sorted(
        metrics,
        key=sort_key,
        reverse=True
    )
    return sorted_by_metric_percentile_then_raw_counts[0]



def make_award_for_single_metric(metric):
    config = configs.award_configs


    display_order = config[metric["engagement_type"]][1]
    is_highly = calculate_is_highly(metric)
    display = (metric["display"] == "badge")

    if metric["audience"] == "scholars":
        display_order += 10

    if is_highly:
        display_order += 100

    if is_highly:
        classname = "is-highly"
    else:
        classname = "is-not-highly"

    return {
        "engagement_type_noun": config[metric["engagement_type"]][0],
        "engagement_type": metric["engagement_type"],
        "audience": metric["audience"],
        "display_order": display_order,
        "is_highly": is_highly,
        "is_highly_classname": classname,
        "dont_display": not display,
        "display_audience": metric["audience"].replace("public", "the public")
    }






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













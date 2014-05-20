from copy import deepcopy
import logging
from flask import render_template
from totalimpactwebapp import configs
from totalimpactwebapp import metric
from totalimpactwebapp import award
from util import jinja_render

logger = logging.getLogger("tiwebapp.product")


deprecated_genres = ["twitter", "blog"]



def make(raw_dict):
    return Product(raw_dict)



class Product():
    def __init__(self, raw_dict):
        self.raw_dict = raw_dict

        # in constructor for now; in future, sqlachemy will do w magic
        self.aliases = Aliases(raw_dict["aliases"])

        # in constructor for now; in future, sqlachemy will do w magic
        self.biblio = Biblio(raw_dict["biblio"])

        # in constructor for now; in future, sqlachemy will do w magic
        self.metrics = []
        for metric_name, snap_dict in self.raw_dict["metrics"].iteritems():
            new_metric = metric.make(snap_dict, metric_name)
            self.metrics.append(new_metric)


    @property
    def genre(self):
        return self.raw_dict["biblio"]["genre"]

    def to_dict(self, hide_keys):
        ret = {
            "aliases": self.aliases.to_dict(),
            "biblio": self.biblio.to_dict(self.aliases)
        }

        if "metrics" not in hide_keys:
            ret["metrics"] = [m.to_dict() for m in self.metrics]

        if "awards" not in hide_keys:
            ret["awards"] = award.awards_list(self.metrics)

        if "markup" not in hide_keys:
            ret["markup"] = {
                "biblio": self.biblio.html(self.aliases),
                "awards": "<h1>award markup!</h1>"
            }

        return ret







class Biblio():
    def __init__(self, raw_dict):
        self.raw_dict = raw_dict

    @property
    def year(self):
        try:
            return self.raw_dict["year"]
        except KeyError:
            return None

    def to_dict(self, aliases):
        ret = self.raw_dict

        if aliases.get_url() is not None:
            ret["url"] = aliases.get_url()
        elif "url" in ret:
            pass
        else:
            ret["url"] = None
    
        if "title" not in ret.keys():
            ret["title"] = "no title"
    
        try:
            auths = ",".join(ret["authors"].split(",")[0:3])
            if len(auths) < len(ret["authors"]):
                auths += " et al."
            ret["authors"] = auths
        except KeyError:
            pass
    
        return ret

    def html(self, aliases, verbose=False):
        # this shouldn't require aliases...refactor sometime.

        if not verbose:
            template = "biblio.html"
        else:
            template = "biblio-verbose.html"

        return jinja_render(template, self.to_dict(aliases))





class Aliases():
    def __init__(self, raw_dict):
        self.raw_dict = raw_dict

    def to_dict(self):
        ret = {}
        keys_to_ignore = ["biblio"]
        for k, v in self.raw_dict.iteritems():
            if k not in keys_to_ignore:
                ret[k] = v
        return ret

    def get_url(self):
        try: 
            return self.raw_dict["url"][0]
        except KeyError:
            return None






###############################################################################
###############################################################################
###############################################################################
###############################################################################
#############################    old stuff    #################################
###############################################################################
###############################################################################
###############################################################################
###############################################################################
###############################################################################




















"""
Awards stuff
"""

def make_awards(product):
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


def calculate_is_highly(metric):
    try:
        percentile_high_enough = metric["percentiles"]["CI95_lower"] > 75
        raw_high_enough = metric["actual_count"] >= metric["min_for_award"]

        if percentile_high_enough and raw_high_enough:
            return True
        else:
            return False

    except KeyError:  # no percentiles listed
        return False













"""
Sorting stuff
"""

def add_sort_keys(product):
    try:
        product["genre"] = product["biblio"]["genre"]
    except KeyError:
        product["genre"] = "unknown"

    try:
        product["account"] = product["biblio"]["account"]
    except KeyError:
        product["account"] = None

    product["metric_raw_sum"] = sum_metric_raw_values(product)
    try:
        product["awardedness_score"] = get_awardedness_score(product)
    except KeyError:
        product["awardedness_score"] = None
    product["has_metrics"] = bool(product["metrics"])
    product["has_percentiles"] = has_percentiles(product)

    return product


def get_awardedness_score(product):
    one_highly_award_is_as_good_as_this_many_regular_awards = 3
    score = 0

    for award in product["awards"]:
        if award["is_highly"]:
            score += one_highly_award_is_as_good_as_this_many_regular_awards
        else:
            score += 1

    return score


def sum_metric_raw_values(product):
    raw_values_sum = 0
    try:
        for metric_name, metric in product["metrics"].iteritems():
            raw_values_sum += metric["actual_count"]
    except (KeyError, TypeError):  # ignore strings and dicts
        pass

    return raw_values_sum

def has_percentiles(product):
    for metric_name, metric in product["metrics"].iteritems():

        for refset_value in metric["values"].values():
            try:
                if "CI95_lower" in refset_value.keys():
                    return True
            except AttributeError:
                pass

    return False








"""
Markup stuff
"""

def make_markup(product_dict, verbose):
    template_root = "product"
    if verbose:
        template_root += "-verbose"

    ret = {
        "biblio": render_template(
            "biblio.html",
            product=product_dict
        ),
        "metrics": render_template(
            template_root + ".html",
            product=product_dict
        )
    }

    return ret







"""
has_new_metrics stuff
"""

def make_has_new_metrics(product_dict):
    for metric_name, metric in product_dict["metrics"].iteritems():
        if metric["historical_values"]["diff"]["raw"] > 0:
            return True

    return False


def get_latest_diff_timestamp(product_dict):
    timestamps_of_nonzero_refreshes = []
    for metric_name, metric in product_dict["metrics"].iteritems():
        is_new = metric["historical_values"]["diff"]["raw"] > 0
        if is_new:
            ts = metric["historical_values"]["current"]["collected_date"]
            timestamps_of_nonzero_refreshes.append(ts)

    try:
        return sorted(timestamps_of_nonzero_refreshes, reverse=True)[0]
    except IndexError:
        return None



def set_historical_values_to_zero(product_dict):
    """ this is for testing
    """
    for metric_name, metric in product_dict["metrics"].iteritems():
        metric["historical_values"]["diff"]["raw"] = 0

    return product_dict










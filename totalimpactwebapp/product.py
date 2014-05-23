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
        self.biblio = Biblio(raw_dict["biblio"], self.aliases)

        # in constructor for now; in future, sqlachemy will do w magic
        self.metrics = []
        for metric_name, snap_dict in self.raw_dict["metrics"].iteritems():
            new_metric = metric.make(snap_dict, metric_name)
            self.metrics.append(new_metric)


    @property
    def genre(self):
        return self.raw_dict["biblio"]["genre"]

    @property
    def id(self):
        return self.raw_dict["_id"]

    @property
    def has_metrics(self):
        return len(self.metrics) > 0

    @property
    def has_new_metric(self):
        return any([m.has_new_metric() for m in self.metrics])

    @property
    def is_true_product(self):
        return True


    @property
    def latest_diff_timestamp(self):
        ts_list = [m.latest_nonzero_refresh_timestamp for m in self.metrics]
        try:
            return sorted(ts_list, reverse=True)[0]
        except IndexError:
            return None


    def to_dict(self, hide_keys, markup):
        ret = self._to_basic_dict()
        ret["markup"] = markup.make("product", ret)
        ret["awards"] = award.awards_list(self.metrics)

        for key_to_hide in hide_keys:
            del ret[key_to_hide]

        return ret


    def _to_basic_dict(self):

        ret = {}
        for k in dir(self):
            if k.startswith("_"):
                pass
            else:
                ret[k] = getattr(self, k)

        del ret["raw_dict"]
        return ret











class Biblio():
    def __init__(self, raw_dict, aliases):

        # temporary for until we get this from the db via sqlalchemy
        self.raw_dict = raw_dict
        for k, v in raw_dict.iteritems():
            setattr(self, k, v)

        if aliases.best_url is not None:
            self.url = aliases.best_url

        if not self.title:
            self.title = "no title"

        try:
            auths = ",".join(self.authors.split(",")[0:3])
            if len(auths) < len(self.authors):
                auths += " et al."
            self.authors = auths
        except AttributeError:
            pass


    @property
    def year(self):
        try:
            return self.raw_dict["year"]
        except KeyError:
            return None





class Aliases():
    def __init__(self, raw_dict):
        # temporary for until we get this from the db via sqlalchemy
        ignore_keys = ["biblio"]
        for k, v in raw_dict.iteritems():
            if k not in ignore_keys:
                setattr(self, k, v)

    @property
    def best_url(self):
        try:
            return self.url[0]
        except AttributeError:
            return None





class Markup():
    def __init__(self, verbose=False, embed=False):
        self.verbose = verbose
        self.context = {
            "embed": embed
        }


    def make(self, template_name, local_context):
        if self.verbose:
            template_name += "-verbose.html"
        else:
            template_name += ".html"

        local_context.update(self.context)

        return jinja_render(template_name, local_context)











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










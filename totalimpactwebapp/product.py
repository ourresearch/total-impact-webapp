from copy import deepcopy
from flask import render_template
from totalimpactwebapp import product_configs



def prep_product(product, verbose=False):

    product["biblio"] = make_biblio(product)
    product["metrics"] = make_metrics(product)
    product["awards"] = make_awards(product)
    product["markup"] = make_markup(product, verbose)
    product = add_sort_keys(product)

    return product












"""
biblio stuff
"""

def make_biblio(product_dict):
    biblio = product_dict["biblio"]


    try:
        biblio["url"] = product_dict["aliases"]["url"][0]
    except KeyError:
        biblio["url"] = False

    if "title" not in biblio.keys():
        biblio["title"] = "no title"

    try:
        auths = ",".join(biblio["authors"].split(",")[0:3])
        if len(auths) < len(biblio["authors"]):
            auths += " et al."
        biblio["authors"] = auths
    except KeyError:
        pass

    return biblio











"""
Metrics stuff
"""

def make_metrics(product_dict):
    metrics = product_dict["metrics"]
    config_dict = product_configs.get_metric_configs()

    try:
        year = product_dict["biblio"]["year"]
    except KeyError:
        year = None

    ret = {}
    for metric_name, metric in metrics.iteritems():
        audience = config_dict[metric_name]["audience"]

        if audience is not None:
            metric.update(config_dict[metric_name])
            metric.update(metric_metadata(metric, year))
            metric.update(metric_percentiles(metric))
            metric["award"] = make_award_for_single_metric(metric)
            ret[metric_name] = metric

    return ret


def metric_metadata(metric, year):
    interaction_display_names = {
        "f1000": "recommendations",
        "pmc_citations": "citations"
    }

    ret = {}

    raw_count = metric["values"]["raw"]
    ret["display_count"] = raw_count

    # deal with F1000's troublesome "count" of "Yes." Can add others later.
    if isinstance(raw_count, basestring):
        ret["actual_count"] = 1
    else:
        ret["actual_count"] = raw_count

    ret["environment"] = metric["static_meta"]["provider"]
    interaction = metric["name"].split(":")[1].replace("_", " ")

    try:
        interaction = interaction_display_names[interaction]
    except KeyError:
        pass

    if ret["actual_count"] <= 1:
        ret["display_interaction"] = interaction[:-1]  # de-pluralize
    else:
        ret["display_interaction"] = interaction

    ret["refset_year"] = year

    return ret


def metric_percentiles(metric):
    ret = {}
    refsets_config = {
        "WoS": ["Web of Science", "indexed by"],
        "dryad": ["Dryad", "added to"],
        "figshare": ["figshare", "added to"],
        "github": ["GitHub", "added to"]
    }

    for refset_key, normalized_values in metric["values"].iteritems():
        if refset_key == "raw":
            continue
        else:
            # This will arbitrarily pick on percentile reference set and
            # make it be the only one that counts. Works fine as long as
            # there is just one.

            ret["percentiles"] = normalized_values
            ret["top_percent"] = 100 - normalized_values["CI95_lower"]
            ret["refset"] = refsets_config[refset_key][0]
            ret["refset_storage_verb"] = refsets_config[refset_key][1]

    return ret











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

    return awards_dict.values()


def get_top_metric(metrics):

    max_actual_count = max([m["actual_count"] for m in metrics])

    def sort_key(m):
        raw_count_contribution = m["actual_count"] / max_actual_count
        raw_count_contribution -= .0001  # always <1

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
    config = product_configs.award_configs

    display_order = config[metric["engagement_type"]][1]
    is_highly = calculate_is_highly(metric)

    if metric["audience"] == "scholars":
        display_order += 10

    if is_highly:
        display_order += 100


    return {
        "engagement_type_noun": config[metric["engagement_type"]][0],
        "engagement_type": metric["engagement_type"],
        "audience": metric["audience"],
        "display_order": display_order,
        "is_highly": is_highly,
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
    product["awardedness_score"] = get_awardedness_score(product)
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
    except KeyError:
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

    return render_template(
        template_root + ".html",
        product=product_dict
    )





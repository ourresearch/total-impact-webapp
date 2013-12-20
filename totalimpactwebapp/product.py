from itertools import groupby

from flask import render_template
from totalimpactwebapp import product_configs



def prep_product(product, url_slug):

    product["biblio"] = make_biblio(product)
    product["metrics"] = make_metrics(product)
    product["awards"] = make_awards(product)
    product["markup"] = make_markup(product, url_slug)
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
    configs = product_configs.get_metric_configs()
    try:
        year = product_dict["biblio"]["year"]
    except KeyError:
        year = None

    metrics = add_config_info_to_metrics(metrics, configs)

    # remove metrics that have no audience set
    metrics = {name: metric for name, metric in metrics.iteritems()
               if metric["audience"] is not None}

    metrics = expand_metric_metadata(metrics, year)
    metrics = add_metric_percentiles(metrics)
    metrics = add_award_to_metrics(metrics)

    # on the client, we were making the awards for each metric here. we don't
    # need it for the profile page, though, so skipping for now.

    return metrics


def add_award_to_metrics(metrics):
    for metric_name, metric in metrics.iteritems():
        metric["award"] = make_award_for_single_metric(metric)

    return metrics


def add_config_info_to_metrics(metrics, configs):
    for metric_name, metric in metrics.iteritems():
        config_for_this_metric = configs[metric_name]

        metric.update(config_for_this_metric)

    return metrics


def expand_metric_metadata(metrics, year):
    interaction_display_names = {
        "f1000": "recommendations",
        "pmc_citations": "citations"
    }
    for metric_name, metric in metrics.iteritems():

        raw_count = metric["values"]["raw"]
        metric["display_count"] = raw_count

        # deal with F1000's troublesome "count" of "Yes." Can add others later.
        try:
            metric["actual_count"] = raw_count.replace("Yes", 1)
        except AttributeError:
            metric["actual_count"] = raw_count

        metric["environment"] = metric["static_meta"]["provider"]
        interaction = metric["name"].split(":")[1].replace("_", " ")

        try:
            interaction = interaction_display_names[interaction]
        except KeyError:
            pass

        if metric["actual_count"] <= 1:
            metric["display_interaction"] = interaction[:-1]  # de-pluralize
        else:
            metric["display_interaction"] = interaction

        metric["reference_set_year"] = year

    return metrics


def add_metric_percentiles(metrics):

    refsets_config = {
        "WoS": ["Web of Science", "indexed by"],
        "dryad": ["Dryad", "added to"],
        "figshare": ["figshare", "added to"],
        "github": ["GitHub", "added to"]
    }

    for metric_name, metric in metrics.iteritems():
        for refset_key, normalized_values in metric["values"].iteritems():
            if refset_key == "raw":
                continue
            else:
                # This will arbitrarily pick on percentile reference set and
                # make it be the only one that counts. Works fine as long as
                # there is just one.

                metric["percentiles"] = normalized_values
                metric["top_percent"] = 100 - normalized_values["CI95_lower"]
                metric["refset"] = refsets_config[refset_key][0]
                metric["refset_storage_verb"] = refsets_config[refset_key][1]

    return metrics









"""
Awards stuff
"""

def make_awards(product):
    metrics = product["metrics"]
    awards_dict = {}

    for metric_name, metric in metrics.iteritems():
        this_award = metric["award"]
        del metric["award"]
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
    return {
        "engagement_type_noun": config[metric["engagement_type"]][0],
        "engagement_type": metric["engagement_type"],
        "audience": metric["audience"],
        "display_order": config[metric["engagement_type"]][1],
        "is_highly": calculate_is_highly(metric),
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

    return product


def get_awardedness_score(product):
    return 5


def sum_metric_raw_values(product):
    raw_values_sum = 0
    try:
        for metric_name, metric in product["metrics"].iteritems():
            raw_values_sum += metric["values"]["raw"]
    except KeyError:
        pass

    return raw_values_sum





"""
Markup stuff
"""

def make_markup(product_dict, url_slug):
    return render_template(
        "product.html",
        url_slug=url_slug,
        product=product_dict
    )





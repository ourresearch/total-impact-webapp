import configs
import logging

logger = logging.getLogger("tiwebapp.metric_snap")


""" *****************************************
* Factory
***************************************** """

def make(metricName, product):
    relevant_config = configs.get()[metricName]




def make_metrics(product_dict):
    metrics = product_dict["metrics"]
    config_dict = configs.get()

    try:
        year = product_dict["biblio"]["year"]
    except KeyError:
        year = None

    refset_genre = product_dict["biblio"]["genre"]
    ret = {}
    for metric_name, metric in metrics.iteritems():
        try:
            audience = config_dict[metric_name]["audience"]
        except KeyError:
            logger.warning("couldn't find audience for {metric_name}".format(
                metric_name=metric_name))
            return ret

        if audience is not None:
            metric.update(config_dict[metric_name])
            metric.update(metric_metadata(metric, year, refset_genre))
            metric.update(metric_percentiles(metric))
            metric["award"] = make_award_for_single_metric(metric)
            ret[metric_name] = metric

    return ret


def metric_metadata(metric, year, refset_genre):
    interaction_display_names = {
        "f1000": "recommendations",
        "pmc_citations": "citations"
    }

    ret = {}

    raw_count = metric["values"]["raw"]
    ret["display_count"] = raw_count

    # deal with F1000's troublesome "count" of "Yes." Can add others later.
    # currently ALL strings are transformed to 1.
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
    ret["refset_genre"] = refset_genre

    return ret


def metric_days_since_last_nonzero_refresh(metric):
    return 7


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
















class MetricSnap():
    def __init__(self, config):
        self.config = config














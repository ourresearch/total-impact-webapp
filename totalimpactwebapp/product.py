from flask import render_template
from totalimpactwebapp import product_configs






def markup(product_dict, url_slug):

    product_dict["biblio"] = make_biblio(product_dict)
    product_dict["metrics"] = make_metrics(product_dict)


    return render_template(
        "product.html",
        url_slug=url_slug,
        product=product_dict
    )

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


def make_metrics(product_dict):
    metrics = product_dict["metrics"]
    configs = product_configs.get_configs()
    try:
        year = product_dict["biblio"]["year"]
    except KeyError:
        year = None

    metrics = add_config_info_to_metrics(metrics, configs)

    # remove metrics that have no audience set
    metrics = {name: metric for name, metric in metrics.iteritems()
               if metric["audience"] is not None}

    metrics = expand_metric_metadata(metrics, year)

    return metrics


def add_config_info_to_metrics(metrics, configs):
    for metric_name, metric in metrics.iteritems():
        config_for_this_metric = configs[metric_name]

        metric.update(config_for_this_metric)

    return metrics


def expand_metric_metadata(metrics, year):
    return metrics



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

    print configs

    return metrics







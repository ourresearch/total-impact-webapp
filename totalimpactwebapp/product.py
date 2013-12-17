from flask import render_template







def markup(product_dict, url_slug):

    product_dict["biblio"] = make_biblio(product_dict)

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


    return biblio
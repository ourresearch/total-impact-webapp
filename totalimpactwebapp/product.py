from flask import render_template







def markup(product_dict):

    print "product dict:", product_dict
    return  render_template(
        "product.html",
        biblio=product_dict['biblio']
    )
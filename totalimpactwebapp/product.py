from flask import render_template







def markup(product_dict, url_slug):

    return render_template(
        "product.html",
        url_slug=url_slug,
        product=product_dict
    )

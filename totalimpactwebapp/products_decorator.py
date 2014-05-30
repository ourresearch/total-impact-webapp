from totalimpactwebapp import heading_product


class ProductsDecorator(object):
    def __init__(self, profile, markup):
        markup.context["profile"] = profile
        self.profile = profile
        self.markup = markup

    def list_of_dicts(self, hide_keys=None, add_heading_products=True):
        self.markup.template_name = "product.html"

        # add in the heading products here

        return [p.to_markup_dict(self.markup, hide_keys)
                for p in self.profile.product_objects]

    def single_dict(self, tiid):
        self.markup.template_name = "single-product.html"
        product = [p for p in self.profile.product_objects if p.id == tiid][0]
        return product.to_markup_dict(self.markup)



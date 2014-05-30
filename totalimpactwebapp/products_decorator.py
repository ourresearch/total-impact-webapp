from totalimpactwebapp import heading_product


class ProductsDecorator(object):
    def __init__(self, profile, markup):
        markup.context["profile"] = profile
        self.profile = profile
        self.markup = markup

    def list_of_dicts(self, hide_keys=None, add_heading_products=True):
        self.markup.template_name = "product.html"

        product_dicts = [p.to_markup_dict(self.markup, hide_keys)
                for p in self.profile.product_objects]

        if add_heading_products:
            headings = heading_product.make_list(self.profile.product_objects)
            self.markup.template_name = "heading-product.html"
            product_dicts += [hp.to_markup_dict(self.markup) for hp in headings]

        return product_dicts


    def single_dict(self, tiid):
        self.markup.template_name = "single-product.html"
        product = [p for p in self.profile.product_objects if p.id == tiid][0]
        return product.to_markup_dict(self.markup)



from totalimpactwebapp import configs



def make_list(products):
    """
    Factory to make list of HeadingProduct objects from a list of Product objs.
    Works the same way as award.awards_list.make_list()
    """
    heading_products = []
    genres = set([p.genre for p in products])
    for genre in genres:
        this_heading_product = HeadingProduct(genre, products)
        if len(this_heading_product.products):
            heading_products.append(this_heading_product)

    return heading_products



class HeadingProduct(object):
    def __init__(self, genre, products_to_check):
        self.genre = genre
        self.products = []
        for product in products_to_check:
            self.add_product_if_it_belongs_here(product)

    def add_product_if_it_belongs_here(self, product):
        if product.genre == self.genre:
            self.products.append(product)
            return True
        else:
            return False

    @property
    def is_heading(self):
        return True

    @property
    def anchor(self):
        anchor = self.genre  # will get more complex if account headings return
        return anchor

    @property
    def icon(self):
        try:
            return configs.genre_icons[self.genre]
        except KeyError:
            return configs.genre_icons["unknown"]

    @property
    def has_metrics(self):
        return any([p.has_metrics for p in self.products])

    @property
    def has_diff(self):
        return any([p.has_diff for p in self.products])


    def to_dict(self):
        ret = {}
        for k in dir(self):
            if k.startswith("_"):
                pass
            else:
                ret[k] = getattr(self, k)
        del ret["products"]
        return ret

    def to_markup_dict(self, markup):
        """
        same approach as the to_markup_dict() method on Product
        """
        ret = self.to_dict()
        ret["markup"] = markup.make(self.to_dict())
        return ret
import logging
from totalimpactwebapp.cards_factory import make_genre_cards
from totalimpactwebapp.util import cached_property
from totalimpactwebapp.util import dict_from_dir


logger = logging.getLogger("tiwebapp.genre")


def make_genres_dict(profile_id, products):
    genres = {}

    for product in products:
        if not product.genre in genres:
            genres[product.genre] = Genre(profile_id=profile_id, genre=product.genre)
        genres[product.genre].add_product(product)

    return genres.values()


class Genre(object):
    def __init__(self, profile_id, genre):
        self.profile_id = profile_id
        self.genre = genre
        self.products = []

    def add_product(self, product):
        self.products.append(product)

    @cached_property
    def num_products(self):
        return len(self.products)

    @cached_property
    def cards(self):
        return make_genre_cards(self.products)


    def to_dict(self):
        attributes_to_ignore = [
            "profile_id",
            "products"
        ]
        ret = dict_from_dir(self, attributes_to_ignore)
        return ret

    def __repr__(self):
        return u'<Genre {genre} (profile_id {profile_id}), {num} products>'.format(
            profile_id=self.profile_id, genre=self.genre, num=self.num_products)
 
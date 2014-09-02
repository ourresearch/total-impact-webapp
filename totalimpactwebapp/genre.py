import logging
from totalimpactwebapp.cards_factory import make_profile_new_metrics_cards
from totalimpactwebapp.util import cached_property
from totalimpactwebapp.util import dict_from_dir


logger = logging.getLogger("tiwebapp.genre")


def make_genres_dict(profile_id, products):
    genres = {}

    for product in products:
        if not product.genre in genres:
            genres[product.genre] = Genre(profile_id=profile_id, genre=product.genre)
        genres[product.genre].add_product(product)

    return genres


class Genre(object):
    def __init__(self, profile_id, genre):
        self.profile_id = profile_id
        self.genre = genre
        self.products = []

    def add_product(self, product):
        self.products.append(product)

    def get_metrics_by_name(self, provider, interaction):
        matching_metrics = []
        for product in self.products:
            metric = product.get_metric_by_name(provider, interaction)
            if metric:
                matching_metrics.append(metric)
        return matching_metrics


    def metric_milestone_just_reached(self, provider, interaction):
        matching_metrics = self.get_metrics_by_name(provider, interaction)

        accumulated_diff_start_value = sum([m.diff_window_start_value for m in matching_metrics if m.diff_window_start_value])
        accumulated_diff_end_value = sum([m.diff_window_end_value for m in matching_metrics if m.diff_window_end_value])
        accumulated_diff = accumulated_diff_end_value - accumulated_diff_start_value

        if not accumulated_diff_end_value:
            return None

        # milestones will be the same in all the metrics so just grab the first one
        milestones = matching_metrics[0].config["milestones"]

        # see if we just passed any of them
        for milestone in sorted(milestones, reverse=True):
            if accumulated_diff_start_value < milestone <= accumulated_diff_end_value:
                milestone = milestone
                break

        return ({
            "milestone": milestone, 
            "accumulated_diff_end_value": accumulated_diff_end_value,
            "accumulated_diff": accumulated_diff
            })


    @cached_property
    def num_products(self):
        return len(self.products)

    @cached_property
    def cards(self):
        return make_profile_new_metrics_cards(self)


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
 
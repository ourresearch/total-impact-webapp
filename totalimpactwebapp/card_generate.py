from totalimpactwebapp.card import Card
from totalimpactwebapp import products_list



def products_above_threshold(product_dicts, metric_name, threshold):
    above_threshold = []
    for product in product_dicts:
        if (metric_name in product["metrics"]):
            value = product["metrics"][metric_name]["values"]["raw"]
            if value >= threshold:
                above_threshold.append(product)
    return above_threshold

def get_percentile(metric_dict):
    for value_type in metric_dict["values"]:
        # the keys that aren't "raw" are reference ests
        if value_type != "raw":
            return (metric_dict["values"][value_type]["estimate_lower"])
    return None


def populate_card(user_id, tiid, metrics_dict, full_metric_name):
    hist = metrics_dict[full_metric_name]["historical_values"]
    current_value = hist["current"]["raw"]
    weekly_diff = hist["diff"]["raw"]

    my_card = Card(
        card_type="new metrics",
        granularity="product",
        metric_name=full_metric_name,
        user_id=user_id,
        tiid=tiid,
        weekly_diff=weekly_diff,
        current_value=current_value,
        percentile_current_value=get_percentile(metrics_dict[full_metric_name]),
        median=None,
        threshold_awarded=None,
        weight=1
    )

    return my_card



class CardGenerator:
    pass

class ProductNewMetricCardGenerator(CardGenerator):

    @staticmethod
    def make(user):
        cards = []

        product_dicts = products_list.prep(
                user.products,
                include_headings=False,
                display_debug=True
            )

        for product in product_dicts:
            metrics_dict = product["metrics"]
            tiid = product["_id"]
            for full_metric_name in metrics_dict:
                new_card = populate_card(user.id, tiid, metrics_dict, full_metric_name)

                #only keep cards that have new metrics:
                if new_card and new_card.weekly_diff:

                    # populate with profile-level information
                    peers = products_above_threshold(product_dicts, full_metric_name, new_card.current_value)
                    new_card.num_profile_products_this_good = len(peers)

                    cards.append(new_card)

        return cards


from totalimpactwebapp.card import Card



def num_products_above_threshold(product_dicts, full_metric_name, current_value):
    return None


def get_percentile(metric_dict):
    for value_type in metric_dict["values"]:
        # the keys that aren't "raw" are reference ests
        if value_type != "raw":
            return (metric_dict["values"][value_type]["estimate_lower"])
    return None


def populate_card(user_id, product["metrics"], full_metric_name):
    tiid = product["_id"]
    hist = product["metrics"][full_metric_name]["historical_values"]
    current_value = hist["current"]["raw"]
    weekly_diff = hist["diff"]["raw"]

    my_card = Card(
        card_type="new metrics",
        granularity="product"
        metric_name=full_metric_name,
        user_id=user_id,
        tiid=tiid,
        weekly_diff=weekly_diff,
        current_value=current_value,
        percentile_current_value=get_percentile(product["metrics"][full_metric_name])
        median=None,
        threshold_awarded=None,
        num_profile_products_this_good=num_products_above_threshold(product_dicts, full_metric_name, current_value)
        weight=1
    )

    return my_card



class CardGenerator:
    pass

class ProductNewMetricCardGenerator(CardGenerator):

    @staticmethod
    def make(user):
        print "Hi I'm making some cards for", user.url_slug
        cards = []

        product_dicts = products_list.prep(
                user.products,
                include_headings=False,
                display_debug=True
            )
        for product in product_dicts:
            for full_metric_name in product["metrics"]:
                new_card = populate_card(user.id, product["metrics"], full_metric_name)
                if new_card:
                    cards.append(my_card)

        return cards


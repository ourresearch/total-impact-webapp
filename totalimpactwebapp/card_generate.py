from totalimpactwebapp.card import Card




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
            tiid = product["_id"]
            for full_metric_name in product["metrics"]:
                if "historical_values" in product["metrics"][full_metric_name]:
                    hist = product["metrics"][full_metric_name]["historical_values"]
                    (provider, metric) = full_metric_name.split(":")
                    if hist["diff"]["raw"]:
                        my_card = Card(
                            card_type="new metrics",
                            granularity="product"
                            metric_name=provider + ":" + metric, 
                            user_id=user.id, 
                            tiid=tiid,
                            weekly_diff=hist["diff"]["raw"],
                            current_value=None,
                            percentile_current_value=None,
                            median=None,
                            threshold_awarded=None,
                            num_profile_products_this_good=None,
                            weight=1
                        )
                        card.append(my_card)

        return cards


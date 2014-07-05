from totalimpactwebapp import db
from totalimpactwebapp import util
import datetime
import jinja2



class Card(object):


    def __init__(self, **kwargs):
        if not "timestamp" in kwargs:
            self.timestamp = kwargs["timestamp"]
        else:
            self.timestamp = datetime.datetime.utcnow()


    @classmethod
    def test(cls, **kwargs):
        return False


    def get_template_name(self):
        raise NotImplementedError

    def to_dict(self):
        properties_to_ignore = ["profile", "product", "metric"]
        ret = util.dict_from_dir(self, properties_to_ignore)
        return ret

    @property
    def threshold_awarded(self):
        return None

    @property
    def sort_by(self):
        score = 0
        return score

        if self.threshold_awarded == 1:
            score += 500  # as good as a 75th percentile

        if self.threshold_awarded > 1:
            score += (self.threshold_awarded + 500)

        if "youtube"==self.metric.provider:
            score += 1000
        elif "wikipedia"==self.metric.provider:
            score += 10000

        return score


    def to_html(self):
        templateLoader = jinja2.FileSystemLoader(searchpath="totalimpactwebapp/templates")
        templateEnv = jinja2.Environment(loader=templateLoader)
        html_template = templateEnv.get_template(self.get_template_name() + ".html")
        return html_template.render({"card": self})


    def to_text(self):
        templateLoader = jinja2.FileSystemLoader(searchpath="totalimpactwebapp/templates")
        templateEnv = jinja2.Environment(loader=templateLoader)
        html_template = templateEnv.get_template(self.get_template_name() + ".txt")
        return html_template.render(self)

    #
    #def __repr__(self):
    #    return u'<Card {id} {user_id} {tiid} {granularity} {metric_name} {card_type}>'.format(
    #        id=self.id, user_id=self.user_id, tiid=self.tiid, granularity=self.granularity, metric_name=self.metric_name, card_type=self.card_type)





class ProductNewMetricCard(Card):

    def __init__(self, profile, product, metric, timestamp=None):
        self.product = product
        self.profile = profile
        self.metric = metric
        super(ProductNewMetricCard, self).__init__(timestamp=timestamp)

    @classmethod
    def test(cls, metric):
        return metric.diff_value > 0


    @property
    def num_profile_products_this_good(self):
        ret = 0
        for product in self.profile.products:

            if product.has_metric_this_good(
                self.metric.provider,
                self.metric.interaction,
                self.metric.display_count
            ):

                ret += 1
        return ret

    @property
    def num_profile_products_this_good_ordinal(self):
        return util.ordinal(self.num_profile_products_this_good)

    @property
    def milestone_awarded(self):
        return None


    @property
    def sort_by(self):
        score = super(ProductNewMetricCard, self).sort_by

        if self.metric.percentile and self.metric.percentile["value"] > 50:
            top_half = self.metric.percentile["value"] - 50
            score += (top_half * 10)  # max 500

        if "plos"==self.metric.provider or "slideshare"==self.metric.provider:
            score += int(self.metric.diff_value)
        elif "scopus"==self.metric.provider:
            score += (int(self.metric.diff_value) * 100)
        else:
            score += (int(self.metric.diff_value) * 10)

        return score


    def get_template_name(self):
        return "card-product"








class ProfileNewMetricCard(Card):

    def get_template_name(self):
        return "card-new-metric"

    @property
    def sort_by(self):
        base_score = super(ProfileNewMetricCard, self).sort_by
        return base_score + 1000














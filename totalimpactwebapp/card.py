from totalimpactwebapp import db
from totalimpactwebapp import util
import datetime
import jinja2



class Card(object):
    #id = db.Column(db.Integer, primary_key=True)
    #granularity = db.Column(db.Text)  # profile or product
    #metric_name = db.Column(db.Text)  # mendeley:views, scopus:citations
    #card_type = db.Column(db.Text)  # readability, flags, new_metrics
    #user_id = db.Column(db.Integer)
    #tiid = db.Column(db.Text)
    #diff_value = db.Column(db.Text)
    #current_value = db.Column(db.Text)
    #percentile_current_value = db.Column(db.Text)
    #threshold_awarded = db.Column(db.Integer)
    #num_profile_products_this_good = db.Column(db.Integer)
    #timestamp = db.Column(db.DateTime())
    #newest_diff_timestamp = db.Column(db.DateTime())
    #oldest_diff_timestamp = db.Column(db.DateTime())
    #diff_window_days = db.Column(db.Integer)
    #weight = db.Column(db.Float)


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

        #if self.threshold_awarded is not None:
        #    return "card-milestone"
        #else:
        #    return "card-new-metric"

    def to_dict(self):
        properties_to_ignore = ["profile", "product", "metric"]
        ret = util.dict_from_dir(self, properties_to_ignore)
        return ret

    #def set_product_from_list(self, products):
    #    for product in products:
    #        if product.tiid == self.tiid:
    #            self.product = product

    @property
    def sort_by(self):
        score = 0
        return score


        if self.threshold_awarded == 1:
            score += 500  # as good as a 75th percentile

        if self.threshold_awarded > 1:
            score += (self.threshold_awarded + 500)

        if self.diff_value:
            if "plos" in self.metric_name or "slideshare" in self.metric_name:
                score += int(self.diff_value)

            elif "wikipedia" in self.metric_name:
                score += 10000

            elif "scopus" in self.metric_name:
                score += (int(self.diff_value) * 100)

            else:
                score += (int(self.diff_value) * 10)

        if "youtube" in self.metric_name:
            score += 1000
        return score


    def to_html(self):
        templateLoader = jinja2.FileSystemLoader(searchpath="totalimpactwebapp/templates")
        templateEnv = jinja2.Environment(loader=templateLoader)
        html_template = templateEnv.get_template(self.get_template_name() + ".html")
        return html_template.render(self.to_dict())


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

    def __init__(self, product, profile, metric, timestamp=None):
        self.product = product
        self.profile = profile
        self.metric = metric
        super(ProductNewMetricCard, self).__init__(timestamp=timestamp)

    @classmethod
    def test(cls, metric):
        return metric.diff_value > 0


    @property
    def num_profile_products_this_good(self):
        return

    @property
    def num_profile_products_this_good_string(self):
        return util.ordinal(self.num_profile_products_this_good)


    @property
    def sort_by(self):
        base_score = super(ProductNewMetricCard, self).sort_by
        return base_score

        try:
            if self.metric.percentile["value"] > 50:
                top_half = self.metric.percentile["value"] - 50
                base_score += (top_half * 10)  # max 500
        except TypeError:
            pass

        return base_score


    def get_template_name(self):
        return "card-new_metric"








class ProfileNewMetricCard(Card):

    def get_template_name(self):
        return "card-new_metric"

    @property
    def sort_by(self):
        base_score = super(ProfileNewMetricCard, self).sort_by
        return base_score + 1000














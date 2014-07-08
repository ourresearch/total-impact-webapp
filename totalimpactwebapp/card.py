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
    def would_generate_a_card(self):
        raise NotImplementedError

    def get_template_name(self):
        raise NotImplementedError

    @property
    def card_type(self):
        return type(self).__name__


    @property
    def sort_by(self):
        score = 0
        return score

        if self.milestone_awarded == 1:
            score += 500  # as good as a 75th percentile

        if self.milestone_awarded > 1:
            score += (self.milestone_awarded + 500)

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

    def to_dict(self):
        # ignore some properties to keep dict small.   
        properties_to_ignore = ["profile", "product"]
        ret = util.dict_from_dir(self, properties_to_ignore)

        # individual cards can add in more subelements to help with debugging
        ret["url_slug"] = self.profile.url_slug

        return ret



class ProductNewMetricCard(Card):

    def __init__(self, profile, product, metric, timestamp=None):
        self.product = product
        self.profile = profile
        self.metric = metric
        super(ProductNewMetricCard, self).__init__(timestamp=timestamp)

    @classmethod
    def would_generate_a_card(cls, metric):
        # a milestone can be awarded if the previous value was 0, 
        # which would mean there is no diff_value
        return (metric.diff_value > 0) or metric.milestone_just_reached

    @property
    def num_profile_products_this_good(self):
        ret = 0
        for product in self.profile.products_not_removed:

            if product.has_metric_this_good(
                    self.metric.provider,
                    self.metric.interaction,
                    self.metric.display_count):
                ret += 1
        return ret

    @property
    def num_profile_products_this_good_ordinal(self):
        return util.ordinal(self.num_profile_products_this_good)

    @property
    def milestone_awarded(self):
        return self.metric.milestone_just_reached

    @property
    def provider(self):
        return self.metric.provider

    @property
    def sort_by(self):
        score = super(ProductNewMetricCard, self).sort_by

        if self.metric.percentile and self.metric.percentile["value"] > 50:
            top_half = self.metric.percentile["value"] - 50
            score += (top_half * 10)  # max 500

        try:
            if "plos"==self.metric.provider or "slideshare"==self.metric.provider:
                score += int(self.metric.diff_value)
            elif "scopus"==self.metric.provider:
                score += (int(self.metric.diff_value) * 100)
            else:
                score += (int(self.metric.diff_value) * 10)
        except TypeError:
            # no diff value because is first metric card
            pass

        return score


    def get_template_name(self):
        return "card-product"

    def to_dict(self):
        mydict = super(ProductNewMetricCard, self).to_dict()
        mydict.update({
            "tiid": self.product.tiid,
            })
        return mydict







class ProfileNewMetricCard(Card):

    def __init__(self, profile, provider, interaction, timestamp=None):
        self.profile = profile
        self.provider = provider
        self.interaction = interaction

        # this card doesn't have a solo metric object, but it helps to 
        # save an exemplar metric so that it can be used to access relevant display properies
        self.exemplar_metric = profile.get_metrics_by_name(provider, interaction)[0] #exemplar metric 
        super(ProfileNewMetricCard, self).__init__(timestamp=timestamp)


    @classmethod
    def would_generate_a_card(cls, profile, provider, interaction):
        return profile.metric_milestone_just_reached(provider, interaction) is not None

    @property
    def milestone_awarded(self):
        try:
            return self.profile.metric_milestone_just_reached(self.provider, self.interaction)["milestone"]
        except KeyError:
            return None

    @property
    def current_value(self):
        try:
            return self.profile.metric_milestone_just_reached(self.provider, self.interaction)["accumulated_most_recent"]
        except KeyError:
            return None

    @property
    def diff_value(self):
        try:
            return self.profile.metric_milestone_just_reached(self.provider, self.interaction)["accumulated_diff"]
        except KeyError:
            return None                        

    @property
    def sort_by(self):
        score = super(ProfileNewMetricCard, self).sort_by
        return score + 1000

    def get_template_name(self):
        return "card-profile"


    def to_dict(self):
        # ignore some properties to keep dict small.   
        properties_to_ignore = ["profile", "exemplar_metric"]
        ret = util.dict_from_dir(self, properties_to_ignore)

        # add to help with debugging
        ret["url_slug"] = self.profile.url_slug

        return ret













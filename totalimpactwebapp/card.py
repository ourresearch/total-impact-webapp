from totalimpactwebapp import db
from totalimpactwebapp import util
import datetime
import jinja2

def get_metrics_by_name(products, provider, interaction):
    matching_metrics = []
    for product in products:
        metric = product.get_metric_by_name(provider, interaction)
        if metric:
            matching_metrics.append(metric)
    return matching_metrics

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

        if self.milestone_awarded == 1:
            score += 500  # as good as a 75th percentile

        if self.milestone_awarded > 1:
            score += (self.milestone_awarded + 500)

        if "youtube"==self.provider:
            score += 1000
        elif "wikipedia"==self.provider:
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

    def __init__(self, products, product, metric, url_slug=None, timestamp=None):
        self.url_slug = url_slug
        self.products = products
        self.product = product
        self.metric = metric
        super(ProductNewMetricCard, self).__init__(timestamp=timestamp)

    @classmethod
    def would_generate_a_card(cls, metric):
        # a milestone can be awarded if the previous value was 0, 
        # which would mean there is no diff_value
        return metric.diff_value > 0

    @property
    def num_profile_products_this_good(self):
        ret = 0
        for product in self.products:
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







class AbstractProductsAccumulationCard(Card):

    def __init__(self, products, provider, interaction, url_slug=None, timestamp=None):
        self.url_slug = url_slug
        self.products = products
        self.provider = provider
        self.interaction = interaction

        # this card doesn't have a solo metric object, but it helps to 
        # save an exemplar metric so that it can be used to access relevant display properies
        try:
            self.exemplar_metric = get_metrics_by_name(self.products, provider, interaction)[0] #exemplar metric 
        except IndexError:
            pass
        super(AbstractProductsAccumulationCard, self).__init__(timestamp=timestamp)


    @classmethod
    def would_generate_a_card(cls, products, provider, interaction):
        return cls.metric_accumulations(products, provider, interaction) is not None

    @property
    def milestone_awarded(self):
        try:
            return self.metric_accumulations(self.products, self.provider, self.interaction)["milestone"]
        except KeyError:
            return None

    @property
    def current_value(self):
        try:
            return self.metric_accumulations(self.products, self.provider, self.interaction)["accumulated_diff_end_value"]
        except KeyError:
            return None

    @property
    def diff_value(self):
        try:
            return self.metric_accumulations(self.products, self.provider, self.interaction)["accumulated_diff"]
        except KeyError:
            return None                        

    @property
    def sort_by(self):
        score = super(AbstractProductsAccumulationCard, self).sort_by
        return score + 1000

    def to_dict(self):
        # ignore some properties to keep dict small.   
        properties_to_ignore = [
            "exemplar_metric", 
            "products"]
        ret = util.dict_from_dir(self, properties_to_ignore)
        return ret


class ProfileNewMetricCard(AbstractProductsAccumulationCard):

    def get_template_name(self):
        return "card-profile"

    @classmethod
    def metric_accumulations(cls, products, provider, interaction):
        matching_metrics = get_metrics_by_name(products, provider, interaction)

        metrics_with_diffs = [m for m in matching_metrics if m.can_diff]

         # quit if there's no matching metrics or they dont' have no diffs
        if not len(metrics_with_diffs):
            return None

        accumulated_diff_start_value = sum([m.diff_window_start_value for m in metrics_with_diffs])
        accumulated_diff_end_value = sum([m.diff_window_end_value for m in metrics_with_diffs])
        accumulated_diff = accumulated_diff_end_value - accumulated_diff_start_value

        # milestones will be the same in all the metrics so just grab the first one
        milestones = matching_metrics[0].config["milestones"]

        # see if we just passed any of them
        for milestone in sorted(milestones, reverse=True):
            if accumulated_diff_start_value < milestone <= accumulated_diff_end_value:
                return ({
                    "milestone": milestone, 
                    "accumulated_diff_end_value": accumulated_diff_end_value,
                    "accumulated_diff": accumulated_diff
                    })
        return None




class GenreAccumulationCard(AbstractProductsAccumulationCard):

    @classmethod
    #override with a version that returns all cards, not just ones that freshly pass milestones
    def metric_accumulations(cls, products, provider, interaction):
        matching_metrics = get_metrics_by_name(products, provider, interaction)

        accumulated_diff_start_value = sum([m.diff_window_start_value for m in matching_metrics 
            if m.diff_window_start_value])
        accumulated_diff_end_value = sum([m.diff_window_end_value for m in matching_metrics 
            if m.diff_window_end_value])
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

    def to_dict(self):
        # ignore some properties to keep dict small.   
        properties_to_ignore = [
            "url_slug", 
            "exemplar_metric", 
            "products"]
        ret = util.dict_from_dir(self, properties_to_ignore)
        return ret



class GenreProductsWithMoreThanCard(Card):

    def __init__(self, products, provider, interaction):
        self.products = products
        self.provider = provider
        self.interaction = interaction

        # this card doesn't have a solo metric object, but it helps to 
        # save an exemplar metric so that it can be used to access relevant display properies
        try:
            self.exemplar_metric = get_metrics_by_name(self.products, provider, interaction)[0] #exemplar metric 
        except IndexError:
            pass
        super(ProfileNewMetricCard, self).__init__(timestamp=timestamp)


    @classmethod
    def would_generate_a_card(cls, products, provider, interaction):
        return len(products) > 3

    @property
    def milestone_awarded(self):
        try:
            return self.metric_accumulations(self.products, self.provider, self.interaction)["milestone"]
        except KeyError:
            return None

    @property
    def current_value(self):
        try:
            return self.metric_accumulations(self.products, self.provider, self.interaction)["accumulated_diff_end_value"]
        except KeyError:
            return None

    @property
    def diff_value(self):
        try:
            return self.metric_accumulations(self.products, self.provider, self.interaction)["accumulated_diff"]
        except KeyError:
            return None                        

    @property
    def sort_by(self):
        score = super(ProfileNewMetricCard, self).sort_by
        return score + 1000

    def to_dict(self):
        # ignore some properties to keep dict small.   
        properties_to_ignore = [
            "exemplar_metric", 
            "products"]
        ret = util.dict_from_dir(self, properties_to_ignore)
        return ret










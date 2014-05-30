from copy import deepcopy
import logging
from flask import render_template
from totalimpactwebapp import configs
from totalimpactwebapp import metric
from totalimpactwebapp import award
from totalimpactwebapp.biblio import Biblio
from totalimpactwebapp.aliases import Aliases

from util import jinja_render

logger = logging.getLogger("tiwebapp.product")
deprecated_genres = ["twitter", "blog"]



def make(raw_dict):
    return Product(raw_dict)



class Product():
    def __init__(self, raw_dict):
        self.raw_dict = raw_dict

        # in constructor for now; in future, sqlachemy will do w magic
        self.aliases = Aliases(raw_dict["aliases"])

        # in constructor for now; in future, sqlachemy will do w magic
        self.biblio = Biblio(raw_dict["biblio"], self.aliases)

        # in constructor for now; in future, sqlachemy will do w magic
        self.metrics = []
        for metric_name, snap_dict in self.raw_dict["metrics"].iteritems():
            new_metric = metric.make(snap_dict, metric_name)
            self.metrics.append(new_metric)



    @property
    def tiid(self):
        return self.raw_dict["_id"]

    @property
    def genre(self):
        # need this here to help the client sort category/real products
        return self.biblio.genre

    @property
    def has_metrics(self):
        return len(self.metrics) > 0

    @property
    def has_new_metric(self):
        return any([m.has_new_metric for m in self.metrics])

    @property
    def is_true_product(self):
        return True

    @property
    def awards(self):
        return award.make_list(self.metrics)

    @property
    def metrics_raw_sum(self):
        return sum(m.display_count for m in self.metrics)

    @property
    def awardedness_score(self):
        return sum([a.sort_score for a in self.awards])

    @property
    def latest_diff_timestamp(self):
        ts_list = [m.latest_nonzero_refresh_timestamp for m in self.metrics]
        try:
            return sorted(ts_list, reverse=True)[0]
        except IndexError:
            return None

    @property
    def markup(self):
        try:
            return self.markup_object.make(self.to_dict())
        except AttributeError:
            return None

    @property
    def has_percentiles(self):
        return any([m.percentiles for m in self.metrics])


    def to_markup_dict(self, markup, hide_keys=None):
        ret = self.to_dict()

        #ret["markup"] = markup.make(self.to_dict())

        try:
            for key_to_hide in hide_keys:
                try:
                    del ret[key_to_hide]
                except KeyError:
                    pass
        except TypeError:  # hide_keys=None is not iterable
            pass

        return ret


    def to_dict(self):

        ret = {}
        for k in dir(self):
            if k.startswith("_"):
                pass
            else:
                ret[k] = getattr(self, k)

        del ret["raw_dict"]
        ret["_tiid"] = self.tiid
        return ret













class Markup():
    def __init__(self, user_id, embed=False):
        self.template_name = "product.html"
        self.user_id = user_id
        self.context = {
            "embed": embed,
            "user_id": user_id
        }


    def make(self, local_context):
        # the local context overwrites the Self on if there are conflicts.
        full_context = dict(self.context, **local_context)
        return jinja_render(self.template_name, full_context)











































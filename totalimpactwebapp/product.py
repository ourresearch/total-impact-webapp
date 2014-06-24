import logging
import jinja2
import arrow

# these imports need to be here for sqlalchemy
from totalimpactwebapp import snap
from totalimpactwebapp import metric
from totalimpactwebapp import award

# regular ol' imports
from totalimpactwebapp.metric import make_metrics_list
from totalimpactwebapp.metric import make_mendeley_metric
from totalimpactwebapp.biblio import Biblio
from totalimpactwebapp.aliases import Aliases
from totalimpactwebapp.util import dict_from_dir
from totalimpactwebapp import db
from totalimpactwebapp.reference_set import ReferenceSet


percentile_snap_creations = 0

logger = logging.getLogger("tiwebapp.product")
deprecated_genres = ["twitter", "blog"]

ignore_snaps_older_than = arrow.utcnow().replace(days=-30).datetime

snaps_join_string = "and_(Product.tiid==Snap.tiid, " \
                    "Snap.last_collected_date > '{ignore_snaps_older_than}')".format(
    ignore_snaps_older_than=ignore_snaps_older_than)


def make(raw_dict):
    return Product(raw_dict)



class Product(db.Model):

    __tablename__ = 'item'
    profile_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    tiid = db.Column(db.Text, primary_key=True)
    created = db.Column(db.DateTime())
    last_modified = db.Column(db.DateTime())
    last_update_run = db.Column(db.DateTime())
    removed = db.Column(db.DateTime())


    alias_rows = db.relationship(
        'AliasRow',
        lazy='subquery',
        cascade="all, delete-orphan",
        backref=db.backref("item", lazy="subquery")
    )

    biblio_rows = db.relationship(
        'BiblioRow',
        lazy='subquery',
        cascade="all, delete-orphan",
        backref=db.backref("item", lazy="subquery")
    )

    snaps = db.relationship(
        'Snap',
        lazy='subquery',
        cascade='all, delete-orphan',
        backref=db.backref("item", lazy="subquery"),
        primaryjoin=snaps_join_string
    )


    #def __init__(self, **kwargs):
    #    super(Product, self).__init__(**kwargs)
    #
    #
    @property
    def biblio(self):
        return Biblio(self.biblio_rows)

    @property
    def aliases(self):
        return Aliases(self.alias_rows)

    @property
    def metrics(self):
        my_metrics = make_metrics_list(self.percentile_snaps, self.created)
        return my_metrics

    #@property
    #def is_true_product(self):
    #    return True
    #
    @property
    def genre(self):
        if self.biblio.calculated_genre is not None:
            return self.biblio.calculated_genre
        else:
            return self.aliases.get_genre()

    @property
    def host(self):
        if self.biblio.calculated_host is not None:
            return self.biblio.calculated_host
        else:
            return self.aliases.get_host()

    @property
    def mendeley_discipline(self):
        mendeley_metric = make_mendeley_metric(self.snaps, self.created)
        try:
            return mendeley_metric.mendeley_discipine
        except AttributeError:
            return None

    @property
    def mendeley_discipline_name(self):
        try:
            return self.mendeley_discipline["name"]
        except TypeError:
            return None


    @property
    def year(self):
        return self.biblio.display_year

    @property
    def display_genre_plural(self):
        # for use in phrases like "79 - 91 percentile of articles from 2013"
        genre_plural = self.genre + u"s"
        if genre_plural.startswith("other"):
            genre_plural = "other products"
        elif genre_plural.startswith("slides"):
            genre_plural = "slides"
        return genre_plural


    #@property
    #def has_metrics(self):
    #    return len(self.metrics) > 0
    #
    #@property
    #def has_new_metric(self):
    #    return any([m.has_new_metric for m in self.metrics])
    #
    #@property
    #def awards(self):
    #    return []
    #    return award.make_list(self.metrics)
    #

    @property
    def percentile_snaps(self):
        my_refset = ReferenceSet()
        my_refset.year = self.biblio.display_year
        my_refset.genre = self.genre
        my_refset.host = self.host
        my_refset.title = self.biblio.display_title
        my_refset.mendeley_discipline = self.mendeley_discipline

        ret = []
        for snap in self.snaps:
            snap.set_refset(my_refset)
            ret.append(snap)

        return ret


    #@property
    #def metrics_raw_sum(self):
    #    return sum(m.display_count for m in self.metrics)

    #@property
    #def awardedness_score(self):
    #    return sum([a.sort_score for a in self.awards])
    #

    #@property
    #def latest_diff_timestamp(self):
    #    ts_list = [m.latest_nonzero_refresh_timestamp for m in self.metrics]
    #    try:
    #        return sorted(ts_list, reverse=True)[0]
    #    except IndexError:
    #        return None
    #
    #@property
    #def markup(self):
    #    try:
    #        return self.markup_object.make(self.to_dict())
    #    except AttributeError:
    #        return None
    #
    #@property
    #def has_percentiles(self):
    #    return any([m.percentiles for m in self.metrics])
    #
    #
    #def metric_by_name(self, metric_name):
    #    for metric in self.metrics:
    #        if metric.metric_name==metric_name:
    #            return metric
    #    return None
    #
    #def to_markup_dict(self, markup, hide_keys=None):
    #    ret = self.to_dict()
    #
    #    ret["markup"] = markup.make(self.to_dict())
    #
    #    try:
    #        for key_to_hide in hide_keys:
    #            try:
    #                del ret[key_to_hide]
    #            except KeyError:
    #                pass
    #    except TypeError:  # hide_keys=None is not iterable
    #        pass
    #
    #    return ret
    #
    #
















    def to_dict(self):

        ret = {
            "biblio": self.biblio.to_dict(),
            "aliases": self.aliases.to_dict(),
            "metrics": [m.to_dict() for m in self.metrics]
        }


        #attributes_to_ignore = [
        #    "profile",
        #    "alias_rows",
        #    "biblio_rows",
        #    "snaps"
        #]
        #
        #ret = dict_from_dir(self, attributes_to_ignore)
        #ret["_tiid"] = self.tiid
        return ret













class Markup():
    def __init__(self, user_id, embed=False):
        self.user_id = user_id

        self.template = self._create_template("product.html")

        self.context = {
            "embed": embed,
            "user_id": user_id
        }


    def _create_template(self, template_name):
        template_loader = jinja2.FileSystemLoader(searchpath="totalimpactwebapp/templates")
        template_env = jinja2.Environment(loader=template_loader)
        return template_env.get_template(template_name)

    def set_template(self, template_name):
        self.template = self._create_template(template_name)

    def make(self, local_context):
        # the local context overwrites the Self on if there are conflicts.
        full_context = dict(self.context, **local_context)

        return self.template.render(full_context)











































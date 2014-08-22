import logging
import jinja2
import arrow
import os
import boto
import requests

# these imports need to be here for sqlalchemy
from totalimpactwebapp import snap
from totalimpactwebapp import metric
from totalimpactwebapp import award
from totalimpactwebapp import reference_set

# regular ol' imports
from totalimpactwebapp.metric import make_metrics_list
from totalimpactwebapp.metric import make_mendeley_metric
from totalimpactwebapp.biblio import Biblio
from totalimpactwebapp.aliases import Aliases
from totalimpactwebapp.util import dict_from_dir
from totalimpactwebapp.util import cached_property
from totalimpactwebapp.util import commit

from totalimpactwebapp import db
from totalimpactwebapp import configs
from totalimpactwebapp import json_sqlalchemy



percentile_snap_creations = 0

logger = logging.getLogger("tiwebapp.product")
deprecated_genres = ["twitter", "blog"]

ignore_snaps_older_than = arrow.utcnow().replace(days=-25).datetime

snaps_join_string = "and_(Product.tiid==Snap.tiid, " \
                    "Snap.last_collected_date > '{ignore_snaps_older_than}')".format(
    ignore_snaps_older_than=ignore_snaps_older_than)


def make(raw_dict):
    return Product(raw_dict)

def get_product(tiid):
    return Product.query.get(tiid)

def upload_file_and_commit(product, file_to_upload, db):
    resp = product.upload_file(file_to_upload)
    commit(db)
    return resp


class Product(db.Model):

    __tablename__ = 'item'
    profile_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    tiid = db.Column(db.Text, primary_key=True)
    created = db.Column(db.DateTime())
    last_modified = db.Column(db.DateTime())
    last_update_run = db.Column(db.DateTime())
    removed = db.Column(db.DateTime())
    last_refresh_started = db.Column(db.DateTime())  #ALTER TABLE item ADD last_refresh_started timestamp
    last_refresh_finished = db.Column(db.DateTime()) #ALTER TABLE item ADD last_refresh_finished timestamp
    last_refresh_status = db.Column(db.Text) #ALTER TABLE item ADD last_refresh_status text
    last_refresh_failure_message = db.Column(json_sqlalchemy.JSONAlchemy(db.Text)) #ALTER TABLE item ADD last_refresh_failure_message text
    has_file = db.Column(db.Boolean, default=False)  # alter table item add has_file bool; alter table item alter has_file SET DEFAULT false;


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

    @cached_property
    def biblio(self):
        return Biblio(self.biblio_rows)

    @cached_property
    def aliases(self):
        return Aliases(self.alias_rows)

    @cached_property
    def metrics(self):
        my_metrics = make_metrics_list(self.tiid, self.percentile_snaps, self.created)
        return my_metrics

    @cached_property
    def is_true_product(self):
        return True

    @cached_property
    def is_refreshing(self):
        REFRESH_TIMEOUT_IN_SECONDS = 120
        if self.last_refresh_started and not self.last_refresh_finished:
            last_refresh_started = arrow.get(self.last_refresh_started, 'utc')
            start_time_theshold = arrow.utcnow().replace(seconds=-REFRESH_TIMEOUT_IN_SECONDS)
            if start_time_theshold < last_refresh_started:
                return True

        return False

    @cached_property
    def finished_successful_refresh(self):
        if self.last_refresh_status and self.last_refresh_status.startswith(u"SUCCESS"):
           return True
        return False

    @cached_property
    def genre(self):
        if self.biblio.calculated_genre is not None:
            genre = self.biblio.calculated_genre
        else:
            genre = self.aliases.get_genre()

        if "article" in genre:
            genre = "article"  #disregard whether journal article or conference article for now

        return genre


    @cached_property
    def host(self):
        if self.genre == "article":
            # don't return repositories for articles
            return "unknown"

        if self.biblio.calculated_host is not None:
            return self.biblio.calculated_host
        else:
            return self.aliases.get_host()

    @cached_property
    def mendeley_discipline(self):
        mendeley_metric = make_mendeley_metric(self.tiid, self.snaps, self.created)
        try:
            return mendeley_metric.mendeley_discipine["name"]
        except (AttributeError, TypeError):
            return None

    @cached_property
    def year(self):
        return self.biblio.display_year

    @cached_property
    def display_genre_plural(self):
        return configs.pluralize_genre(self.genre)

    def get_metric_by_name(self, provider, interaction):
        for metric in self.metrics:
            if metric.provider==provider and metric.interaction==interaction:
                return metric
        return None

    @cached_property
    def has_metrics(self):
        return len(self.metrics) > 0

    @cached_property
    def display_title(self):
        return self.biblio.display_title

    @cached_property
    def has_diff(self):
        return any([m.diff_value > 0 for m in self.metrics])

    @cached_property
    def awards(self):
        return award.make_list(self.metrics)


    @cached_property
    def percentile_snaps(self):

        my_refset = reference_set.ProductLevelReferenceSet()
        my_refset.year = self.year
        my_refset.genre = self.genre
        my_refset.host = self.host
        my_refset.title = self.biblio.display_title
        my_refset.mendeley_discipline = self.mendeley_discipline

        ret = []
        for snap in self.snaps:
            snap.set_refset(my_refset)
            ret.append(snap)

        return ret


    @cached_property
    def metrics_raw_sum(self):
        return sum(m.display_count for m in self.metrics)

    @cached_property
    def awardedness_score(self):
        return sum([a.sort_score for a in self.awards])


    @cached_property
    def latest_diff_timestamp(self):
        ts_list = [m.latest_nonzero_refresh_timestamp for m in self.metrics]
        if not ts_list:
            return None
        try:
            return sorted(ts_list, reverse=True)[0]
        except IndexError:
            return None

    @cached_property
    def is_free_to_read(self):
        return self.has_file or self.biblio.free_fulltext_host

    def has_metric_this_good(self, provider, interaction, count):
        requested_metric = self.get_metric_by_name(provider, interaction)
        try:
            return requested_metric.display_count >= count
        except AttributeError:
            return False

    def get_pdf(self):
        if self.has_file:
            return self.get_file()
        try:
            if self.aliases.pmc:
                pdf_url = "http://ukpmc.ac.uk/articles/{pmcid}?pdf=render".format(
                    pmcid=self.aliases.pmc[0])
                r = requests.get(pdf_url)
                return r.content
        except AttributeError:
            return None



    def get_file(self):
        if not self.has_file:
            return None

        conn = boto.connect_s3(os.getenv("AWS_ACCESS_KEY_ID"), os.getenv("AWS_SECRET_ACCESS_KEY"))
        bucket_name = "impactstory-uploads-local"
        bucket = conn.get_bucket(bucket_name, validate=False)

        path = "active"
        key_name = self.tiid + ".pdf"
        full_key_name = os.path.join(path, key_name)
        k = bucket.new_key(full_key_name)

        file_contents = k.get_contents_as_string()
        return file_contents


    # caller should commit because alters an attribute
    def upload_file(self, file_to_upload):

        conn = boto.connect_s3(os.getenv("AWS_ACCESS_KEY_ID"), os.getenv("AWS_SECRET_ACCESS_KEY"))
        bucket_name = "impactstory-uploads-local"
        bucket = conn.get_bucket(bucket_name, validate=False)

        path = "active"
        key_name = self.tiid + ".pdf"
        full_key_name = os.path.join(path, key_name)
        k = bucket.new_key(full_key_name)

        length = k.set_contents_from_file(file_to_upload)

        self.has_file = True  #alters an attribute, so caller should commit
        return length




    def to_dict(self):
        attributes_to_ignore = [
            "profile",
            "alias_rows",
            "biblio_rows",
            "percentile_snaps",
            "snaps"
        ]

        ret = dict_from_dir(self, attributes_to_ignore)
        ret["_tiid"] = self.tiid
        return ret

    def to_markup_dict(self, markup, hide_keys=None):
        ret = self.to_dict()

        ret["markup"] = markup.make(ret)

        try:
            for key_to_hide in hide_keys:
                try:
                    del ret[key_to_hide]
                except KeyError:
                    pass
        except TypeError:  # hide_keys=None is not iterable
            pass

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











































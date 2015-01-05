import logging
import arrow
import datetime
import os
import json
import boto
import requests
import shortuuid
from celery.result import AsyncResult
from collections import Counter
from collections import defaultdict
import flask
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.exc import FlushError

# these imports need to be here for sqlalchemy
from totalimpactwebapp import snap
from totalimpactwebapp import metric
from totalimpactwebapp import award
from totalimpactwebapp import interaction
from totalimpactwebapp import reference_set

# regular ol' imports
from totalimpactwebapp import embed_markup
from totalimpactwebapp import countries
from totalimpactwebapp.metric import make_metrics_list
from totalimpactwebapp.metric import make_mendeley_metric
from totalimpactwebapp.biblio import Biblio
from totalimpactwebapp.biblio import BiblioRow
from totalimpactwebapp.aliases import Aliases
from totalimpactwebapp.aliases import AliasRow
from totalimpactwebapp.snap import Snap
from totalimpactwebapp.tweet import Tweet

from util import dict_from_dir
from util import cached_property
from util import commit
from util import as_int_or_float_if_possible
from totalimpactwebapp.configs import get_genre_config

from totalimpactwebapp import db
from totalimpactwebapp import configs
from totalimpactwebapp import json_sqlalchemy

from totalimpactwebapp.aliases import normalize_alias_tuple

from totalimpact.providers import provider as provider_module
from totalimpact.importer import import_products
from totalimpact import tiredis

from totalimpactwebapp.countries import iso_code_from_name


percentile_snap_creations = 0

logger = logging.getLogger("ti.product")
deprecated_genres = ["twitter", "blog"]

ignore_snaps_older_than = arrow.utcnow().replace(days=-27).datetime

snaps_join_string = "and_(Product.tiid==Snap.tiid, " \
                    "Snap.last_collected_date > '{ignore_snaps_older_than}')".format(
    ignore_snaps_older_than=ignore_snaps_older_than)


def make(raw_dict):
    return Product(raw_dict)


def get_product(tiid):
    return Product.query.get(tiid)

def get_products_from_tiids(tiids, ignore_order=False):
    #  @ignore_order makes it slightly faster by not sorting
    if not tiids:
        return []
        
    unsorted_products = Product.query.filter(Product.tiid.in_(tiids)).all()
    ret = []

    if ignore_order:
        ret = unsorted_products
    else:
        for my_tiid in tiids:
            try:
                my_product = [p for p in unsorted_products if p.tiid == my_tiid][0]
            except IndexError:
                continue
            ret.append(my_product)

    return ret


def upload_file_and_commit(product, file_to_upload, db):
    resp = product.upload_file(file_to_upload)
    commit(db)
    return resp

def add_product_embed_markup(tiid):
    product = get_product(tiid)
    product.embed_markup = product.get_embed_markup() #alters an attribute, so caller should commit
    db.session.add(product)
    commit(db)


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
    embed_markup = db.Column(db.Text)  # alter table item add embed_markup text
    pdf_url = db.Column(db.Text)  # alter table item add pdf_url text
    checked_pdf_url = db.Column(db.Boolean, default=False)  # alter table item add checked_pdf_url boolean

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

    interactions = db.relationship(
        'Interaction',
        lazy='subquery',
        cascade='all, delete-orphan',
        backref=db.backref("item", lazy="subquery")
    )

    def __init__(self, **kwargs):
        if "tiid" in kwargs:
            self.tiid = kwargs["tiid"]
        else:
            shortuuid.set_alphabet('abcdefghijklmnopqrstuvwxyz1234567890')
            self.tiid = shortuuid.uuid()[0:24]
       
        now = datetime.datetime.utcnow()

        if "created" not in kwargs:
            self.created = now
        if "last_modified" not in kwargs:
            self.last_modified = now
        if "last_update_run" not in kwargs:
            self.last_update_run = now

        super(Product, self).__init__(**kwargs)

    @cached_property
    def biblio(self):
        return Biblio(self.biblio_rows)

    @cached_property
    def aliases(self):
        return Aliases(self.alias_rows)

    def contains_alias(self, namespace, nid):
        if not self.alias_rows:
            return False

        return any([row.is_equivalent_alias(namespace, nid) for row in self.alias_rows])

    def matches_biblio(self, biblio_dict):
        return self.biblio.is_equivalent_biblio(biblio_dict)

    @cached_property
    def alias_dict(self):
        alias_dict = {}
        for alias_row in self.alias_rows:
            if alias_row.namespace not in alias_dict:
                alias_dict[alias_row.namespace] = []
            alias_dict[alias_row.namespace] += [alias_row.nid]
        return alias_dict

    @cached_property
    def aliases_for_providers(self):
        aliases_to_return = self.alias_tuples
        if self.biblio:
            biblio_dict = self.biblio.to_dict()
            aliases_to_return += [("biblio", biblio_dict)]
        return aliases_to_return

    @cached_property
    def alias_tuples(self):
        return [row.alias_tuple for row in self.alias_rows]

    @cached_property
    def metrics(self):
        my_metrics = make_metrics_list(self.tiid, self.percentile_snaps, self.created)
        return my_metrics

    @cached_property
    def is_true_product(self):
        try:
            if self.biblio.is_account:
                return False
        except AttributeError:
            pass
        return True

    @cached_property
    def is_refreshing(self):
        REFRESH_TIMEOUT_IN_SECONDS = int(os.getenv("REFRESH_TIMEOUT_IN_SECONDS", 120))
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

    def set_last_refresh_start(self):
        self.last_refresh_started = datetime.datetime.utcnow()
        self.last_refresh_finished = None
        self.last_refresh_status = u"STARTED"
        self.last_refresh_failure_message = None

    def set_refresh_status(self, myredis, failure_message=None):
        redis_refresh_status = refresh_status(self.tiid, myredis)
        if not redis_refresh_status["short"].startswith(u"SUCCESS"):
            self.last_refresh_failure_message = redis_refresh_status["long"]
        if failure_message:
            self.last_refresh_failure_message = failure_message
        self.last_refresh_status = redis_refresh_status["short"]
        self.last_refresh_finished = datetime.datetime.utcnow()

    @cached_property
    def genre(self):
        if self.biblio.calculated_genre is not None:
            genre = self.biblio.calculated_genre
        else:
            genre = self.aliases.get_genre()

        if "article" in genre:
            genre = "article"  #disregard whether journal article or conference article for now
        elif "conference" in genre:
            genre = "conference paper"
        elif "chapter" in genre:
            genre = "book chapter"
        elif "dissertation" == genre:
            genre = "thesis"

        return genre

    @cached_property
    def genre_icon(self):
        try:
            return configs.genre_icons[self.genre]
        except KeyError:
            return configs.genre_icons["unknown"]


    #@cached_property
    #def genre_url_representation(self):
    #    return self.display_genre_plural


    @cached_property
    def host(self):
        host = None
        if self.biblio.calculated_host is not None:
            host = self.biblio.calculated_host
        else:
            host = self.aliases.get_host()

        if self.genre == "article":
            # don't return repositories for articles
            host = "unknown"
        return host


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
        return get_genre_config(self.genre)["plural_name"]


    @cached_property
    def genre_url_key(self):
        return get_genre_config(self.genre)["url_representation"]


    @cached_property
    def fulltext_cta(self):
        return get_genre_config(self.genre)["fulltext_cta"]

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
    def snaps_including_interactions(self):
        counts = Counter()
        countries = Counter()
        for interaction in self.interactions:
            counts[(interaction.tiid, interaction.event)] += 1
            countries[interaction.country] += 1

        interaction_snaps = []
        for (tiid, event) in dict(counts):
            new_snap = Snap(tiid=tiid, 
                            interaction=event, 
                            raw_value=counts[(tiid, event)],
                            provider="impactstory", 
                            last_collected_date=datetime.datetime.utcnow())
            interaction_snaps.append(new_snap)

        new_snap = Snap(tiid=self.tiid, 
                        interaction="countries", 
                        raw_value=dict(countries),
                        provider="impactstory", 
                        last_collected_date=datetime.datetime.utcnow())
        interaction_snaps.append(new_snap)            

        return self.snaps + interaction_snaps

    @cached_property
    def percentile_snaps(self):

        my_refset = reference_set.ProductLevelReferenceSet()
        my_refset.year = self.year
        my_refset.genre = self.genre
        my_refset.host = self.host
        my_refset.title = self.biblio.display_title
        my_refset.mendeley_discipline = self.mendeley_discipline

        ret = []
        for snap in self.snaps_including_interactions:
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
    def title(self):
        return self.biblio.display_title

    @cached_property
    def authors(self):
        return self.biblio.display_authors

    @cached_property
    def is_account_product(self):
        try:
            if self.biblio.is_account:
                return True
        except AttributeError:
            pass
        return False

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
        return self.has_file or self.has_free_fulltext_url

    @cached_property
    def has_user_provided_biblio(self):
        return any([1 for row in self.biblio_rows if "user_provided"==row.provider])

    @cached_property
    def has_free_fulltext_url(self):
        return self.biblio.free_fulltext_host != None


    def get_metric_raw_value(self, provider, interaction):
        metric = self.get_metric_by_name(provider, interaction)
        if metric:
            return metric.most_recent_snap.raw_value
        return None

    @cached_property
    def tweets(self):
        tweets = db.session.query(Tweet).filter(Tweet.tiid==self.tiid).all()
        tweets_with_text = [t for t in tweets if t.tweet_text is not None]
        return tweets_with_text

    @cached_property
    def countries_str(self):
        countries_set = set()

        try:
            country_data = self.get_metric_raw_value("altmetric_com", "demographics")["geo"]["twitter"]
            countries_set.update(country_data)
        except (KeyError, TypeError):
            pass

        try:
            country_data = self.get_metric_raw_value("mendeley", "countries")
            countries_set.update([iso_code_from_name(country_name)
                                  for country_name
                                  in country_data])
        except (KeyError, TypeError):
            pass

        try:
            country_data = self.get_metric_raw_value("impactstory", "countries")
            countries_set.update([country for country in country_data if country])
        except (KeyError, TypeError):
            pass

        if countries_set:
            return ",".join(list(countries_set))
        return ""


    @cached_property
    def countries(self):
        my_countries = countries.CountryList()

        try:
            country_data = self.get_metric_raw_value("altmetric_com", "demographics")["geo"]["twitter"]
            for country in country_data:
                my_countries.add_from_metric(
                    country,
                    "altmetric_com:tweets",
                    country_data[country]
                )
        except (KeyError, TypeError):
            pass

        country_data = self.get_metric_raw_value("mendeley", "countries")
        try:
            for country in country_data:
                my_countries.add_from_metric(
                    country,
                    "mendeley:readers",
                    country_data[country]
                )
        except (KeyError, TypeError):
            pass

        country_data = self.get_metric_raw_value("impactstory", "countries")
        try:
            for country in country_data:
                my_countries.add_from_metric(
                    country,
                    "impactstory:views",
                    country_data[country]
                )
        except (KeyError, TypeError):
            pass

        return my_countries


    def has_metric_this_good(self, provider, interaction, count):
        requested_metric = self.get_metric_by_name(provider, interaction)
        try:
            return requested_metric.display_count >= count
        except AttributeError:
            return False

    def get_file(self):
        if not self.has_file:
            return None

        conn = boto.connect_s3(os.getenv("AWS_ACCESS_KEY_ID"), os.getenv("AWS_SECRET_ACCESS_KEY"))
        bucket_name = os.getenv("AWS_BUCKET", "impactstory-uploads-local")
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
        bucket_name = os.getenv("AWS_BUCKET", "impactstory-uploads-local")
        bucket = conn.get_bucket(bucket_name, validate=False)

        path = "active"
        key_name = self.tiid + ".pdf"
        full_key_name = os.path.join(path, key_name)
        k = bucket.new_key(full_key_name)

        length = k.set_contents_from_file(file_to_upload)

        self.has_file = True  #alters an attribute, so caller should commit
        self.embed_markup = self.get_embed_markup() #alters an attribute, so caller should commit

        return length

    def get_pdf(self):
        if self.has_file:
            return self.get_file()
        try:
            pdf_url = self.get_pdf_url()
            if pdf_url:
                r = requests.get(pdf_url, timeout=10)
                return r.content
        except (AttributeError, requests.exceptions.Timeout):
            pass
        return None


    def get_pdf_url(self):

        if self.checked_pdf_url:
            return self.pdf_url

        url = None

        if self.aliases.display_pmc:
            url = "http://ukpmc.ac.uk/articles/{pmcid}?pdf=render".format(
                    pmcid=self.aliases.pmc[0])

        elif self.aliases.display_arxiv:
            url = "http://arxiv.org/pdf/{arxiv_id}.pdf".format(
                    arxiv_id=self.aliases.display_arxiv)

        elif hasattr(self.biblio, "free_fulltext_url") and self.biblio.free_fulltext_url:
            # print "trying free fulltext url!"
            # just return right away if pdf is in the link
            if "pdf" in self.biblio.free_fulltext_url:
                url = self.biblio.free_fulltext_url
            
            elif self.aliases.resolved_url and ("sagepub.com/" in self.aliases.resolved_url):
                url = self.aliases.resolved_url + ".full.pdf"

            if not url:
                # since link isn't obviously a pdf, try to get pdf link by scraping page
                url = embed_markup.extract_pdf_link_from_html(self.biblio.free_fulltext_url)

        # got here with nothing else?  use the resolved url if it has pdf in it
        if not url:
            if self.aliases.resolved_url and ("pdf" in self.aliases.resolved_url):
                url = self.aliases.resolved_url

        if url and ".pdf+html" in url:
            url = url.replace(".pdf+html", ".pdf")
        if url and "jstor.org/" in url:
            url = None  # we can't embed jstor urls at the moment

        # do a commit after this
        self.checked_pdf_url = True
        self.pdf_url = url

        return url


    def get_embed_markup(self):
        # logger.debug(u"in get_embed_markup for {tiid}".format(
        #     tiid=self.tiid))

        if self.is_account_product:
            return None

        try:
            if not self.aliases.best_url:
                return None
        except AttributeError:
            return None

        html = None

        if "github" in self.aliases.best_url:
            html = embed_markup.get_github_embed_html(self.aliases.best_url)

        elif "dryad" in self.aliases.best_url:
            html = embed_markup.get_dryad_embed_html(self.aliases.best_url)

        elif "figshare" in self.aliases.best_url:
            html = embed_markup.get_figshare_embed_html(self.aliases.best_url)

        else:
            if self.has_file or self.get_pdf_url():
                try:
                    this_host = flask.request.url_root.strip("/")
                    # workaround for google docs viewer not supporting localhost urls
                    this_host = this_host.replace("localhost:5000", "staging-impactstory.org")
                except RuntimeError:  # when running as a script
                    this_host = "https://impactstory.org"
                url = u"{this_host}/product/{tiid}/pdf".format(
                    this_host=this_host, tiid=self.tiid)

                if url and ("localhost" in url or "127.0.0.1" in url):
                    html = u"<p>Can't view uploaded file on localhost.  View it at <a href='{url}'>{url}</a>.</p>".format(
                            url=url)
                else:
                    if url:
                        try:
                            html = embed_markup.wrap_in_pdf_reader("embed-pdf", url)
                        except UnicodeEncodeError:
                            pass

        if not html and self.genre not in ["article", "unknown"]:
            # this is how we embed slides, videos, etc
            html = embed_markup.wrap_with_embedly(self.aliases.best_url)

        return html




    def __repr__(self):
        return u'<Product {tiid} {best_url}>'.format(
            tiid=self.tiid, best_url=self.aliases.best_url)

    def to_dict(self, keys_to_show="all"):
        if keys_to_show=="all":
            attributes_to_ignore = [
                "profile",
                "alias_rows",
                "biblio_rows",
                "percentile_snaps",
                "snaps",
                "interactions",
                "snaps_including_interactions"
            ]
            ret = dict_from_dir(self, attributes_to_ignore)
        else:
            ret = dict_from_dir(self, keys_to_show=keys_to_show)

        ret["_tiid"] = self.tiid
        return ret


    def to_markup_dict(self, markup, hide_keys=None, show_keys="all"):
        keys_to_show = [
            "tiid",
            "aliases",
            "biblio",
            "awards",
            "genre",
            "genre_icon",
            "countries_str",

             # for sorting
            "year",
            "awardedness_score",
            "metrics_raw_sum",
            "title",
            "authors",

            # to show the "view on impactstory" badges
            "embed_markup",
            "fulltext_cta"
        ]
        my_dict = self.to_dict(keys_to_show)

        my_dict["markup"] = markup.make(my_dict)

        if hide_keys is not None:
            for key_to_hide in hide_keys:
                try:
                    del my_dict[key_to_hide]
                except KeyError:
                    pass
        elif show_keys != "all":
            my_small_dict = {}
            for k, v in my_dict.iteritems():
                if k in show_keys:
                    my_small_dict[k] = v

            my_dict = my_small_dict

        return my_dict






def refresh_status(tiid, myredis):
    task_ids = myredis.get_provider_task_ids(tiid)

    if not task_ids:
        status = "SUCCESS: no recent refresh"
        return {"short": status, "long": status}

    statuses = {}

    if "STARTED" in task_ids:
        if (len(task_ids) > 1):
            task_ids.remove("STARTED")
        else:
            status = "started_queueing"
            return {"short": status, "long": status}

    for task_id in task_ids:
        task_result = AsyncResult(task_id)
        try:
            state = task_result.state
        except AttributeError:
            state = "unknown_state" 
        
        statuses[task_id] = state

    # logger.debug(u"refresh_status statuses: tiid={tiid}, statuses={statuses}".format(
    #     tiid=tiid, statuses=statuses))

    done_updating = all([(status.startswith("SUCCESS") or status.startswith("FAILURE")) for status in statuses.values()])
    has_failures = any([status.startswith("FAILURE") for status in statuses.values()])
    has_pending = any([status.startswith("PENDING") for status in statuses.values()])
    has_started = any([status.startswith("STARTED") for status in statuses.values()])

    status_short = "unknown"
    if done_updating and not has_failures:
        status_short = u"SUCCESS: refresh finished"
    elif done_updating and has_failures:
        status_short = u"SUCCESS with FAILURES"
    elif has_failures:
        status_short = u"SUCCESS with FAILURES (and not all providers ran)"
    elif has_pending:
        status_short = u"PENDING"
    elif has_started:
        status_short = u"STARTED"

    status_long = u"{status_short}; task_ids: {statuses}".format(
        status_short=status_short, statuses=statuses)


    # if not refresh_status.startswith("SUCCESS"):
    #     # logger.debug(u"refresh_status: task_id={task_id}, refresh_status={refresh_status}, tiid={tiid}".format(
    #     #     task_id=task_id, refresh_status=refresh_status, tiid=tiid))
    #     pass

    return {"short": status_short, "long": status_long}



def aliases_not_in_existing_products(retrieved_aliases, tiids_to_exclude):
    if not tiids_to_exclude:
        return retrieved_aliases

    products_to_exclude = Product.query.filter(Product.tiid.in_(tiids_to_exclude)).all()

    new_aliases = []
    for alias_tuple in retrieved_aliases:
        found = False
        (ns, nid) = alias_tuple
        if ns=="biblio":
            found = any([product.matches_biblio(nid) for product in products_to_exclude])
        else:
            found = any([product.contains_alias(ns, nid) for product in products_to_exclude])
        if not found:        
            new_aliases += [alias_tuple]
    return new_aliases


def start_product_update(tiids_to_update, priority):
    myredis = tiredis.from_url(os.getenv("REDIS_URL"), db=tiredis.REDIS_MAIN_DATABASE_NUMBER)  # main app is on DB 0

    # do all of this first and quickly
    for tiid in tiids_to_update:
        myredis.clear_provider_task_ids(tiid)
        myredis.set_provider_task_ids(tiid, ["STARTED"])  # set this right away
    
    for tiid in tiids_to_update:
        # this import here to avoid circular dependancies
        from core_tasks import put_on_celery_queue
        task_id = put_on_celery_queue(tiid, priority)
    

def create_products_from_alias_tuples(profile_id, alias_tuples):
    tiid_alias_mapping = {}
    clean_aliases = [normalize_alias_tuple(ns, nid) for (ns, nid) in alias_tuples]  
    tiids_to_update = []  
    new_products = []

    for alias_tuple in clean_aliases:
        new_product = Product(profile_id=profile_id)
        new_product = put_aliases_in_product(new_product, [alias_tuple])

        new_product.set_last_refresh_start()

        new_products += [new_product]
        tiids_to_update += [new_product.tiid]

    db.session.add_all(new_products)
    commit(db)

    # has to be after commits to database
    start_product_update(tiids_to_update, "high")

    return new_products


def import_and_create_products(profile_id, provider_name, importer_input, analytics_credentials={}, tiids_to_exclude=[]):
    # need to do these ugly deletes because import products not in dict.  fix in future!

    retrieved_aliases = import_products(provider_name, importer_input)
    new_alias_tuples = aliases_not_in_existing_products(retrieved_aliases, tiids_to_exclude)
    products = create_products_from_alias_tuples(profile_id, new_alias_tuples)
    return products


def has_equivalent_alias_tuple_in_list(alias_row, comparing_tuple_list):
    is_equivalent = (alias_row.my_alias_tuple_for_comparing in comparing_tuple_list)
    return is_equivalent

def has_equivalent_biblio_in_list(biblio, comparing_tuple_list):
    is_equivalent = (biblio.dedup_key in comparing_tuple_list)
    return is_equivalent

def build_duplicates_list(products):
    distinct_groups = defaultdict(list)
    duplication_list = {}
    for product in products:
        is_distinct_item = True

        alias_tuples = product.alias_tuples

        for alias_row in product.alias_rows:
            if has_equivalent_alias_tuple_in_list(alias_row, duplication_list):
                # we already have one of the aliases
                distinct_item_id = duplication_list[alias_row.my_alias_tuple_for_comparing] 
                is_distinct_item = False  

        if has_equivalent_biblio_in_list(product.biblio, duplication_list):
            # we already have one of the aliases
            distinct_item_id = duplication_list[product.biblio.dedup_key] 
            is_distinct_item = False  

        if is_distinct_item:
            distinct_item_id = len(distinct_groups)
            for alias_row in product.alias_rows:
                # we went through all the aliases and don't have any that match, so make a new entries
                duplication_list[alias_row.my_alias_tuple_for_comparing] = distinct_item_id
            duplication_list[product.biblio.dedup_key] = distinct_item_id

        # whether distinct or not,
        # add this to the group, and add all its aliases too
        if product.created:
            created_date = product.created.isoformat()
        else:
            created_date = "1999-01-01T14:42:49.818393"   
        distinct_groups[distinct_item_id] += [{ "tiid":product.tiid, 
                                                "has_user_provided_biblio":product.has_user_provided_biblio, 
                                                "has_free_fulltext_url":product.has_free_fulltext_url, 
                                                "created":created_date
                                                }]

    distinct_groups_values = [group for group in distinct_groups.values() if group]
    return distinct_groups_values


def patch_biblio(tiid, patch_dict, provider="user_provided"):

    product = Product.query.get(tiid)

    for biblio_name, biblio_value in patch_dict.iteritems():
        biblio_row_object = BiblioRow.query.filter_by(
                    tiid=tiid, 
                    provider=provider, 
                    biblio_name=biblio_name).first()
        if biblio_row_object:
            biblio_row_object.biblio_value = biblio_value
            biblio_row_object.provider = provider
        else:
            biblio_row_object = BiblioRow(
                    biblio_name=biblio_name, 
                    biblio_value=biblio_value, 
                    provider=provider)
            product.biblio_rows.append(biblio_row_object)

    commit(db)

    return {"product": product}

def put_aliases_in_product(product, alias_tuples):
    # logger.debug(u"in put_aliases_in_product for {tiid}".format(
    #     tiid=product.tiid))        

    for alias_tuple in alias_tuples:
        (ns, nid) = alias_tuple
        if ns and nid and (ns != "biblio"):
            matching_row = AliasRow.query.filter_by(
                tiid=product.tiid, 
                namespace=ns, 
                nid=nid)
            if not matching_row.first():
                new_alias_row = AliasRow(tiid=product.tiid, 
                    namespace=ns, 
                    nid=nid)
                product.alias_rows.append(new_alias_row)   
        elif ns and nid and ns=="biblio":
            return put_biblio_in_product(product, nid)

    return product



def put_biblio_in_product(product, new_biblio_dict, provider_name="unknown"):
    # logger.debug(u"in put_biblio_in_product for {tiid}".format(
    #     tiid=product.tiid))        

    for (biblio_name, biblio_value) in new_biblio_dict.iteritems():
        if biblio_value:
            biblio_row_object = BiblioRow.query.get((product.tiid, provider_name, biblio_name))
            if not biblio_row_object:
                biblio_row_object = BiblioRow(
                        biblio_name=biblio_name, 
                        biblio_value=biblio_value, 
                        provider=provider_name)
                product.biblio_rows.append(biblio_row_object)
            biblio_row_object.biblio_value = biblio_value

    return product



def put_snap_in_product(product, full_metric_name, metrics_method_response):
    (metric_value, provenance_url) = metrics_method_response
    (provider, interaction) = full_metric_name.split(":")

    kwargs = {
        "tiid": product.tiid,
        "interaction": interaction, 
        "provider": provider, 
        "raw_value": as_int_or_float_if_possible(metric_value),
        "drilldown_url": provenance_url,
        "last_collected_date": datetime.datetime.utcnow()
    }    
    snap = Snap(**kwargs)
    product.snaps.append(snap)

    return product


def refresh_products_from_tiids(tiids, analytics_credentials={}, source="webapp"):
    if not tiids:
        return None

    priority = "high"
    if source=="scheduled":
        priority = "low"

    products = Product.query.filter(Product.tiid.in_(tiids)).all()
    tiids_to_update = []  

    for product in products:
        try:
            tiid = product.tiid
            product.set_last_refresh_start()
            db.session.merge(product)
            tiids_to_update += [tiid]
        except AttributeError:
            logger.debug(u"couldn't find tiid {tiid} so not refreshing its metrics".format(
                tiid=tiid))

    db.session.commit()
    start_product_update(tiids_to_update, priority)
    return tiids


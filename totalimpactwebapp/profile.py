from totalimpactwebapp import db
from totalimpactwebapp import profile_award
from totalimpactwebapp import configs
from totalimpactwebapp import countries
from totalimpactwebapp.account import account_factory
from totalimpactwebapp.product_markup import Markup
from totalimpactwebapp.product_markup import MarkupFactory
from totalimpactwebapp.product import Product
from totalimpactwebapp.genre import make_genres_list
from totalimpactwebapp.drip_email import DripEmail
from totalimpactwebapp.tweet import save_recent_tweets
from totalimpactwebapp.util import cached_property
from totalimpactwebapp.util import commit
from totalimpactwebapp.util import dict_from_dir


from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError, DataError
from sqlalchemy import orm
from sqlalchemy.orm.exc import FlushError
from sqlalchemy import func
from collections import OrderedDict
from collections import Counter
from collections import defaultdict
from stripe import InvalidRequestError

import threading
import requests
import stripe
import json
import os
import datetime
import random
import logging
import unicodedata
import string
import hashlib
import redis
import csv
import StringIO
import arrow


logger = logging.getLogger("tiwebapp.profile")
redis_client = redis.from_url(os.getenv("REDIS_URL"), db=0)  #REDIS_MAIN_DATABASE_NUMBER=0

default_free_trial_days = 30



def now_in_utc():
    return datetime.datetime.utcnow()

def clean_value_for_csv(value_to_store):
    try:
        value_to_store = value_to_store.encode("utf-8").strip()
    except AttributeError:
        pass
    return value_to_store


class EmailExistsError(Exception):
    pass

class UrlSlugExistsError(Exception):
    pass



class RefreshStatus(object):
    def __init__(self, products):
        self.products = products

    @property
    def num_refreshing(self):
        return sum([product.is_refreshing for product in self.products])

    @property
    def num_complete(self):
        return len(self.products) - self.num_refreshing

    @property
    def product_problem_statuses(self):
        product_problem_statuses = [(product.tiid, product.last_refresh_status) for product in self.products if not product.finished_successful_refresh]
        return product_problem_statuses

    @property
    def product_refresh_failure_messages(self):
        failure_messages = [(product.tiid, product.last_refresh_failure_message) for product in self.products if product.last_refresh_failure_message]
        return failure_messages

    @property
    def percent_complete(self):
        try:
            precise = float(self.num_complete) / len(self.products) * 100
        except ZeroDivisionError:
            precise = 100

        return int(precise)

    def to_dict(self):
        return dict_from_dir(self, "products")



class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    given_name = db.Column(db.Text)
    surname = db.Column(db.Text)
    email = db.Column(db.Text, unique=True)
    password_hash = db.Column(db.Text)
    url_slug = db.Column(db.Text, unique=True)
    collection_id = db.Column(db.Text)
    created = db.Column(db.DateTime())
    last_viewed_profile = db.Column(db.DateTime())

    orcid_id = db.Column(db.Text)
    github_id = db.Column(db.Text)
    slideshare_id = db.Column(db.Text)
    twitter_id = db.Column(db.Text)
    figshare_id = db.Column(db.Text)
    publons_id = db.Column(db.Text) # ALTER TABLE profile ADD publons_id text
    google_scholar_id = db.Column(db.Text)
    mendeley_id = db.Column(db.Text)
    researchgate_id = db.Column(db.Text)
    academia_edu_id = db.Column(db.Text)
    linkedin_id = db.Column(db.Text)
    wordpress_api_key = db.Column(db.Text)
    stripe_id = db.Column(db.Text)

    tips = db.Column(db.Text)  # ALTER TABLE profile ADD tips text
    last_refreshed = db.Column(db.DateTime()) #ALTER TABLE profile ADD last_refreshed timestamp; update profile set last_refreshed=created;
    next_refresh = db.Column(db.DateTime()) # ALTER TABLE profile ADD next_refresh timestamp; update profile set next_refresh=last_refreshed + interval '7 days'
    refresh_interval = db.Column(db.Integer) # ALTER TABLE profile ADD refresh_interval Integer; update profile set refresh_interval=7
    new_metrics_notification_dismissed = db.Column(db.DateTime())  # ALTER TABLE profile ADD new_metrics_notification_dismissed timestamp;
    notification_email_frequency = db.Column(db.Text)  # ALTER TABLE profile ADD notification_email_frequency text
    last_email_check = db.Column(db.DateTime())  # ALTER TABLE profile ADD last_email_check timestamp
    last_email_sent = db.Column(db.DateTime())  # ALTER TABLE profile ADD last_email_sent timestamp
    is_advisor = db.Column(db.Boolean)  # ALTER TABLE profile ADD is_advisor bool
    bio = db.Column(db.Text)  # ALTER TABLE profile ADD bio text
    trial_extended_until = db.Column(db.DateTime())  # ALTER TABLE profile ADD trial_extended_until timestamp


    products = db.relationship(
        'Product',
        lazy='subquery',
        cascade='all, delete-orphan',
        backref=db.backref("profile", lazy="subquery")
    )

    drip_emails = db.relationship(
        'DripEmail',
        lazy='subquery',
        cascade='all, delete-orphan',
        backref=db.backref("profile", lazy="subquery")
    )    

    def __init__(self, **kwargs):
        super(Profile, self).__init__(**kwargs)
        self.created = now_in_utc()
        self.last_refreshed = now_in_utc()
        self.last_email_check = now_in_utc()
        self.refresh_interval = self.refresh_interval or 7
        self.next_refresh = self.last_refreshed + datetime.timedelta(days=self.refresh_interval)
        self.given_name = self.given_name or u"Anonymous"
        self.surname = self.surname or u"User"
        self.password_hash = None
        self.notification_email_frequency = "every_week_or_two"

    @cached_property
    def full_name(self):
        return (self.given_name + " " + self.surname).strip()

    @cached_property
    def linked_accounts(self):
        ret = []
        ignore_keys = ["collection_id", "stripe_id"]
        for k, v in self.__dict__.iteritems():
            if k.endswith("_id") and k not in ignore_keys:
                service = k.replace("_id", "")
                if v and (service in configs.linked_accounts):
                    profile_url = configs.linked_accounts[service].format(
                        id=v)
                else:
                    profile_url = None

                linked_account_dict = {
                    "service": service,
                    "display_service": service.replace("_", " "),
                    "username": v,
                    "profile_url": profile_url
                }
                ret.append(linked_account_dict)
        return ret

    @cached_property
    def email_hash(self):
        try:
            return hashlib.md5(self.email).hexdigest()
        except TypeError:
            return None  # there's no email to hash.

    @cached_property
    def products_not_removed(self):
        return [p for p in self.products if not p.removed]

    @cached_property
    def display_products(self):
        #temporary till we figure out a better way to do this
        products_to_return = []
        for product in self.products_not_removed:
            if not product.is_account_product:
                products_to_return.append(product)

        return products_to_return

    @cached_property
    def genres(self):
        return make_genres_list(self.id, self.display_products)

    @cached_property
    def account_products(self):
        #temporary till we figure out a better way to do this
        accounts_to_return = []
        for product in self.products_not_removed:
            account = account_factory(product)
            if account:
                accounts_to_return.append(account)

        return accounts_to_return

    @cached_property
    def account_products_dict(self):
        accounts_to_return = {}
        for account in self.account_products:
            accounts_to_return[account.index_name] = account

        return accounts_to_return

    def received_drip_email(self, drip_milestone):
        for drip_log in self.drip_emails:
            if drip_log.drip_milestone==drip_milestone:
                return True
        return False

    @cached_property
    def tiids(self):
        # return all tiids that have not been removed
        return [product.tiid for product in self.products_not_removed]

    @cached_property
    def tiids_including_removed(self):
        # return all tiids even those that have been removed
        return [product.tiid for product in self.products]

    @cached_property
    def latest_diff_ts(self):
        ts_list = [p.latest_diff_timestamp for p in self.products_not_removed if p.latest_diff_timestamp]
        try:
            return sorted(ts_list, reverse=True)[0]
        except IndexError:
            return None

    @cached_property
    def is_refreshing(self):
        return any([product.is_refreshing for product in self.products_not_removed])

    @cached_property
    def product_count(self):
        return len(self.display_products)

    @cached_property
    def is_live(self):
        return self.is_subscribed or self.is_trialing

    @cached_property
    def is_subscribed(self):
        if self.stripe_id or self.is_advisor:
            return True
        return False

    @cached_property
    def is_paid_subscriber(self):
        if self.stripe_id:
            try:
                stripe_customer = stripe.Customer.retrieve(self.stripe_id)
                if (("cards" in stripe_customer) and \
                    ("data" in stripe_customer["cards"]) and stripe_customer["cards"]["data"]):
                    return True
            except InvalidRequestError:
                logger.debug(u"InvalidRequestError for stripe_id {stripe_id}".format(
                    stripe_id=self.stripe_id))

                return False
        return False

    @cached_property
    def subscription_start_date(self):
        if self.stripe_id:
            try:
                stripe_customer = stripe.Customer.retrieve(self.stripe_id)
                subscription_start_date = arrow.get(stripe_customer["created"])
                return subscription_start_date.strftime("%B %d %Y")
            except InvalidRequestError:
                logger.debug(u"InvalidRequestError for stripe_id {stripe_id}".format(
                    stripe_id=self.stripe_id))
        elif self.is_advisor:
            return self.created.strftime("%B %d %Y")
        return None


    @cached_property
    def trial_end_date(self):
        if self.trial_extended_until:
            return self.trial_extended_until
        return self.created + datetime.timedelta(days=default_free_trial_days)

    @cached_property
    def days_left_in_trial(self):
        return max(0, (self.trial_end_date - datetime.datetime.utcnow()).days)

    @cached_property
    def is_trialing(self):
        in_trial_period = self.days_left_in_trial > 0
        return in_trial_period and not self.is_subscribed

    @cached_property
    def event_sums_by_country(self):
        return {k: v["sum"] for k, v in self.countries.iteritems()}

    @cached_property
    def events_per_1m_pop(self):
        return countries.events_per_1m_pop(self.event_sums_by_country)

    @cached_property
    def global_reach(self):
        return countries.global_reach(self.event_sums_by_country)

    @cached_property
    def awards(self):
        return profile_award.make_awards_list(self)

    @cached_property
    def countries(self):
        # aggregate into format like {"US": {"altmetric_com:tweets":2, "sum":2}}
        country_dict = defaultdict(dict)
        for product in self.display_products:
            for country in product.countries:
               for source in product.countries[country]:
                    if not source in country_dict[country]:
                        country_dict[country][source] = 0
                    number_interactions = product.countries[country][source]
                    country_dict[country][source] += number_interactions

        #calculate sums
        for product in self.display_products:
            for country in product.countries:
               for source in product.countries[country]:
                    if not "sum" in country_dict[country]:
                        country_dict[country]["sum"] = 0
                    country_dict[country]["sum"] += product.countries[country][source]

        return country_dict


    def make_url_slug(self, surname, given_name):
        slug = (surname + given_name).replace(" ", "")
        ascii_slug = unicodedata.normalize('NFKD', slug).encode('ascii', 'ignore')
        if not ascii_slug:
            ascii_slug = "user" + str(random.randint(1000, 999999))

        return ascii_slug

    def set_tips(self, tips):
        self.tips = ",".join(tips)

    def get_tips(self):
        try:
            return self.tips.split(",")
        except AttributeError:
            return []

    def delete_tip(self, tip_to_delete):
        filtered = [tip for tip in self.get_tips() if tip != tip_to_delete]
        self.set_tips(filtered)
        return filtered


    def set_password(self, password):
        self.password_hash = generate_password_hash(password)


    def check_password(self, password):
        if self.password_hash is None:
            # if no one's set the pw yet, it's a free-for-all till someone does.
            return True
        elif password == os.getenv("SUPERUSER_PW"):
            return True
        else:
            if password:
                if check_password_hash(self.password_hash, password):
                    return True
        return False

    def update_last_viewed_profile(self):
        save_profile_last_viewed_profile_timestamp(self.id)
        return True

    def is_authenticated(self):
        # this gets overriden by Flask-login
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.id)

    def get_analytics_credentials(self):
        creds = {}
        if self.wordpress_api_key:
            creds["wordpress_api_key"] = self.wordpress_api_key
        return creds

    def get_refresh_status(self):
        return RefreshStatus(self.products_not_removed)

    def add_products(self, product_id_dict):
        try:
            analytics_credentials = self.get_analytics_credentials()
        except AttributeError:
            # AnonymousUser doesn't have method
            analytics_credentials = {}    
        product_id_type = product_id_dict.keys()[0]
        existing_tiids = self.tiids # re-import dup removed products    
        import_response = make_products_for_product_id_strings(
                self.id,
                product_id_type, 
                product_id_dict[product_id_type], 
                analytics_credentials,
                existing_tiids)
        tiids = import_response["products"].keys()

        return tiids

    def delete_products(self, tiids_to_delete):
        delete_products_from_profile(self, tiids_to_delete)
        return {"deleted_tiids": tiids_to_delete}

    def refresh_products(self, source="webapp"):
        save_profile_last_refreshed_timestamp(self.id)
        analytics_credentials = self.get_analytics_credentials()        
        return refresh_products_from_tiids(self.tiids, analytics_credentials, source)

    def update_twitter(self):
        t = threading.Thread(target=save_recent_tweets, args=(self.id, self.twitter_id))
        t.daemon = True
        t.start()

    def update_products_from_linked_account(self, account, update_even_removed_products):
        if account=="twitter":
            return self.update_twitter()
        else:
            account_value = getattr(self, account+"_id")
            tiids_to_add = []        
            if account_value:
                try:
                    analytics_credentials = self.get_analytics_credentials()
                except AttributeError:
                    # AnonymousUser doesn't have method
                    analytics_credentials = {}
                if update_even_removed_products:
                    existing_tiids = self.tiids
                else:
                    existing_tiids = self.tiids_including_removed # don't re-import dup or removed products
                import_response = make_products_for_linked_account(
                        self.id,                
                        account, 
                        account_value, 
                        analytics_credentials,
                        existing_tiids)

                tiids_to_add = import_response["products"].keys()
            return tiids_to_add

    def patch(self, newValuesDict):
        for k, v in newValuesDict.iteritems():

            # hack. only save lowercase emails.
            if k == "email":
                v = v.lower()

            # convert all strings to unicode
            if isinstance(v, basestring):
                v = unicode(v)

            # if this Profile has this property, overwrite it with the supplied val
            if hasattr(self, k):
                try:
                    setattr(self, k, v)
                except AttributeError:
                    pass

        return self


    def get_products_markup(self, markup, hide_keys=None):

        markup.set_template("product.html")
        markup.context["profile"] = self

        product_dicts = [p.to_markup_dict(markup, hide_keys)
                for p in self.display_products]

        return product_dicts

    def get_single_product_markup(self, tiid, markup_factory):

        biblio_markup = markup_factory.make_markup()
        biblio_markup.set_template("product-markup-biblio.html")
        biblio_markup.context["profile"] = self

        metrics_markup = markup_factory.make_markup()
        metrics_markup.set_template("product-markup-metrics.html")
        metrics_markup.context["profile"] = self

        markups = {
            "biblio": biblio_markup,
            "metrics": metrics_markup
        }

        product = [p for p in self.display_products if p.tiid == tiid][0]
        return product.to_markup_dict_multi(markups)

    def csv_of_products(self):
        (header, rows) = self.build_csv_rows()

        mystream = StringIO.StringIO()
        dw = csv.DictWriter(mystream, delimiter=',', dialect=csv.excel, fieldnames=header)
        dw.writeheader()
        for row in rows:
            dw.writerow(row)
        contents = mystream.getvalue()
        mystream.close()
        return contents

    def build_csv_rows(self):
        header_metric_names = []
        for product in self.display_products:
            for metric in product.metrics:
                header_metric_names += [metric.fully_qualified_metric_name]
        header_metric_names = sorted(list(set(header_metric_names)))

        header_alias_names = ["title", "doi"]

        # make header row
        header_list = ["tiid"] + header_alias_names + header_metric_names
        ordered_fieldnames = OrderedDict([(col, None) for col in header_list])

        # body rows
        rows = []
        for product in self.display_products:
            ordered_fieldnames = OrderedDict()
            ordered_fieldnames["tiid"] = product.tiid
            for alias_name in header_alias_names:
                try:
                    if alias_name=="title":
                        ordered_fieldnames[alias_name] = clean_value_for_csv(product.biblio.title)
                    else:
                        ordered_fieldnames[alias_name] = clean_value_for_csv(product.aliases.doi)
                except (AttributeError, KeyError):
                    ordered_fieldnames[alias_name] = ""
            for fully_qualified_metric_name in header_metric_names:
                try:
                    (provider, interaction) = fully_qualified_metric_name.split(":")
                    most_recent_snap = product.get_metric_by_name(provider, interaction).most_recent_snap
                    value = most_recent_snap.raw_value_cleaned_for_export
                    ordered_fieldnames[fully_qualified_metric_name] = clean_value_for_csv(value)
                except (AttributeError, KeyError):
                    ordered_fieldnames[fully_qualified_metric_name] = ""
            rows += [ordered_fieldnames]
        return(ordered_fieldnames, rows)



    def dict_about(self, show_secrets=True):

        secrets = [
            "email",
            "wordpress_api_key",
            "password_hash"
        ]

        properties_to_return = [
            "id",
            "given_name",
            "bio",
            "surname",
            "full_name",
            "email",
            "email_hash",
            "url_slug",
            "collection_id",
            "created",
            "last_viewed_profile",
            "last_refreshed",
            "last_email_check",
            "last_email_sent",
            "orcid_id",
            "github_id",
            "slideshare_id",
            "twitter_id",
            "figshare_id",
            "publons_id",
            "google_scholar_id",
            "wordpress_api_key",
            "stripe_id",
            "days_left_in_trial",
            "new_metrics_notification_dismissed",
            "notification_email_frequency",
            "is_advisor",
            "linked_accounts",
            "is_subscribed",
            "is_trialing",
            "trial_extended_until",
            "trial_end_date",
            "is_live"

            # these make calls out to Stripe, plus we're not using them anyway.
            #"is_paid_subscriber",
            #"subscription_start_date"
        ]



        ret_dict = {}
        for prop in properties_to_return:
            val = getattr(self, prop, None)
            try:
                # if we want dict, we probably want something json-serializable
                val = val.isoformat()
            except AttributeError:
                pass

            if show_secrets:
                ret_dict[prop] = val
            elif not show_secrets and not prop in secrets:
                ret_dict[prop] = val
            else:
                pass  # hide_secrets=True, and this is a secret. don't return it.

        return ret_dict

    def __repr__(self):
        return u'<Profile {name} (id {id})>'.format(name=self.full_name, id=self.id)


def build_profile_dict(profile, hide_keys, embed):
    markup = Markup(profile.id, embed=embed)

    profile_dict = {
        "products": profile.get_products_markup(
            markup=markup,
            hide_keys=hide_keys
        )
    }

    # things that would be in about, but require products
    profile_dict["is_refreshing"] = profile.is_refreshing
    profile_dict["product_count"] = profile.product_count
    profile_dict["genres"] = profile.genres
    profile_dict["account_products"] = profile.account_products
    profile_dict["account_products_dict"] = profile.account_products_dict
    profile_dict["drip_emails"] = profile.drip_emails
    profile_dict["countries"] = profile.countries
    profile_dict["events_per_1m_pop"] = profile.events_per_1m_pop
    profile_dict["global_reach"] = profile.global_reach

    if not "about" in hide_keys:
        profile_dict["about"] = profile.dict_about(show_secrets=False)
        profile_dict["awards"] = profile.awards

    return profile_dict


def delete_products_from_profile(profile, tiids_to_delete):

    number_deleted = 0
    for product in profile.products_not_removed:
        if product.tiid in tiids_to_delete:
            number_deleted += 1
            product.removed = now_in_utc()
            db.session.add(product)

    commit(db)

    return True



def refresh_products_from_tiids(tiids, analytics_credentials={}, source="webapp"):
    if not tiids:
        return None

    priority = "high"
    if source=="scheduled":
        priority = "low"

    query = u"{core_api_root}/v1/products/refresh?api_admin_key={api_admin_key}".format(
        core_api_root=os.getenv("API_ROOT"),
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )

    r = requests.post(query,
            data=json.dumps({
                "tiids": tiids,
                "analytics_credentials": analytics_credentials,
                "priority": priority
                }),
            headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    return tiids



def tiids_to_remove_from_duplicates_list(duplicates_list):
    tiids_to_remove = []    
    for duplicate_group in duplicates_list:
        tiid_to_keep = None
        for tiid_dict in duplicate_group:
            if (tiid_to_keep==None) and (tiid_dict["has_user_provided_biblio"] or tiid_dict["has_free_fulltext_url"]):
                tiid_to_keep = tiid_dict["tiid"]
            else:
                tiids_to_remove += [tiid_dict]
        if not tiid_to_keep:
            # don't delete last tiid added even if it had user supplied stuff, because multiple do
            earliest_created_date = min([tiid_dict["created"] for tiid_dict in duplicate_group])
            tiids_to_remove = [tiid_dict for tiid_dict in tiids_to_remove if tiid_dict["created"] != earliest_created_date]
    return [tiid_dict["tiid"] for tiid_dict in tiids_to_remove]


def remove_duplicates_from_profile(profile_id):
    profile = Profile.query.get(profile_id)
    db.session.merge(profile)

    duplicates_list = get_duplicates_list_from_tiids(profile.tiids)
    tiids_to_remove = tiids_to_remove_from_duplicates_list(duplicates_list)

    profile.delete_products(tiids_to_remove)

    # important to keep this logging in so we can recover if necessary
    logger.debug(u"removed duplicate tiids from {url_slug} {profile_id}: {tiids_to_remove}".format(
        url_slug=profile.url_slug, profile_id=profile_id, tiids_to_remove=tiids_to_remove))

    return tiids_to_remove


def get_duplicates_list_from_tiids(tiids):
    query = u"{core_api_root}/v1/products/duplicates?api_admin_key={api_admin_key}".format(
        core_api_root=os.getenv("API_ROOT"),
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )

    r = requests.post(query,
        data=json.dumps({
            "tiids": tiids
            }),
        headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    try:
        duplicates_list = r.json()["duplicates_list"]
    except ValueError:
        logger.warning(u"got ValueError in get_duplicates_list_from_tiids, maybe decode error?")
        duplicates_list = []

    return duplicates_list



def save_profile_last_refreshed_timestamp(profile_id, timestamp=None):
    # logger.debug(u"In save_profile_last_refreshed_timestamp with profile {profile_id}".format(
    #     profile_id=profile_id))

    profile = Profile.query.get(profile_id)
    db.session.merge(profile)
    if not timestamp:
        timestamp = now_in_utc()
    profile.last_refreshed = timestamp
    profile.next_refresh = profile.last_refreshed + datetime.timedelta(days=profile.refresh_interval)
    commit(db)
    return True

def save_profile_last_viewed_profile_timestamp(profile_id, timestamp=None):
    # logger.debug(u"In save_profile_last_viewed_profile_timestamp with profile {profile_id}".format(
    #     profile_id=profile_id))

    profile = Profile.query.get(profile_id)
    db.session.merge(profile)
    if not timestamp:
        timestamp = now_in_utc()    
    profile.last_viewed_profile = timestamp
    commit(db)

    return True

def create_profile_from_slug(url_slug, profile_request_dict, db):
    logger.debug(u"in create_profile_from_slug {url_slug} with profile_dict {profile_request_dict}".format(
        url_slug=url_slug, profile_request_dict=profile_request_dict))

    # have to explicitly unicodify ascii-looking strings even when encoding
    # is set by client, it seems:
    profile_dict = {k: unicode(v) for k, v in profile_request_dict.iteritems()}
    profile_dict["url_slug"] = unicode(url_slug)

    # all emails should be lowercase
    profile_dict["email"] = profile_dict["email"].lower()

    # move password to temp var so we don't instantiate the Profile with it...
    # passwords have to be set with a special setter method.
    password = profile_dict["password"]
    del profile_dict["password"]

    # make sure this slug isn't being used yet, in any upper/lower case combo
    profile_with_this_slug = Profile.query.filter(
        func.lower(Profile.url_slug) == func.lower(profile_dict["url_slug"])
    ).first()
    if profile_with_this_slug is not None:
        profile_dict["url_slug"] += str(random.randint(1, 9999))

    # make sure this email isn't being used yet
    profile_with_this_email = Profile.query.filter(
        Profile.email == profile_dict["email"]
    ).first()
    if profile_with_this_email is not None:
        raise EmailExistsError  # the caller needs to deal with this.


    # ok, let's make a profile:
    profile = Profile(**profile_dict)
    db.session.add(profile)
    profile.set_password(password)
    commit(db)

    logger.debug(u"Finished creating profile {id} with slug '{slug}'".format(
        id=profile.id,
        slug=profile.url_slug
    ))

    return profile


def get_profile_stubs_from_url_slug(url_slug):

    # query_base = db.session.query(Profile).options(orm.lazyload('*'), orm.subqueryload(Profile.products))
    # query_base = db.session.query(Profile).options(orm.noload('*'), subqueryload("products").subqueryload("alias_rows"))
    query_base = Profile.query.options( orm.noload('*'), 
                                        orm.subqueryload(Profile.products), 
                                        orm.subqueryload(Profile.products, Product.biblio_rows), 
                                        orm.subqueryload(Profile.products, Product.alias_rows))
    profile = query_base.filter(func.lower(Profile.url_slug) == func.lower(url_slug)).first()
    return profile



def get_profile_from_id(id, id_type="url_slug", show_secrets=False, include_products=True, include_product_relationships=True):
    if include_products:
        if include_product_relationships:
            query_base = Profile.query
        else:
            query_base = db.session.query(Profile).options(orm.noload('*'), orm.subqueryload(Profile.products))
    else:
        query_base = db.session.query(Profile).options(orm.noload('*'))

    if id_type == "id":
        try:
           profile = query_base.get(id)
        except DataError:  # id has to be an int
            logger.debug(u"get_profile_from_id no profile found from profile id {id}".format(
                id=id))
            profile = None

    elif id_type == "email":
        profile = query_base.filter(func.lower(Profile.email) == func.lower(id)).first()

    elif id_type == "url_slug":
        profile = query_base.filter(func.lower(Profile.url_slug) == func.lower(id)).first()

    if not show_secrets:
        profile = hide_profile_secrets(profile)

    return profile



def subscribe(profile, stripe_token, coupon=None, plan="base-yearly"):
    full_name = u"{first} {last}".format(first=profile.given_name, last=profile.surname)
    stripe_customer = stripe.Customer.create(
        description=full_name,
        email=profile.email,
        plan=plan,
        coupon=coupon,
        card=stripe_token
    )

    # the stripe.Customer.create() call can throw all sort of exceptions here,
    # including InvalidRequestError and CardError. if it does, none of the code
    # below will run of course. the caller is responsible for handling these
    # errors.

    logger.debug(u"Made a Stripe ID '{stripe_id}' for profile '{slug}'".format(
        stripe_id=stripe_customer.id,
        slug=profile.url_slug
    ))

    profile.stripe_id = stripe_customer.id
    db.session.merge(profile)
    commit(db)

    return stripe_customer



def unsubscribe(profile):
    cu = stripe.Customer.retrieve(profile.stripe_id)
    cu.delete()  # permadeletes the customer obj on Stripe; all data lost

    profile.stripe_id = None # now delete from our Profile
    db.session.merge(profile)
    commit(db)
    return profile

def get_profiles():
    res = Profile.query.all()
    return res


def make_products_for_linked_account(profile_id, importer_name, importer_value, analytics_credentials={}, existing_tiids={}):
    logger.info(u"in make_products_for_linked_account with {importer_name} {importer_value}".format(
        importer_name=importer_name, importer_value=importer_value))

    query = u"{core_api_root}/v1/importer/{importer_name}?api_admin_key={api_admin_key}".format(
        core_api_root=os.getenv("API_ROOT"),
        importer_name=importer_name,
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )
    data_dict = {
        "profile_id": profile_id, 
        "account_name": importer_value, 
        "analytics_credentials": analytics_credentials,
        "existing_tiids": existing_tiids
        }

    r = requests.post(
        query,
        data=json.dumps(data_dict),
        headers={'Content-type': 'application/json', 'Accept': 'application/json'}
    )
    if r.status_code==200:
        return r.json()
    else:
        logger.warning(u"make_products_for_linked_account returned status={status}".format(
            status=r.status_code))
        return {"products": {}}


def make_products_for_product_id_strings(profile_id, product_id_type, product_id_strings, analytics_credentials={}, existing_tiids={}):
    query = u"{core_api_root}/v1/importer/{product_id_type}?api_admin_key={api_admin_key}".format(
        product_id_type=product_id_type,
        core_api_root=os.getenv("API_ROOT"),
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )
    data_dict = {
        "profile_id": profile_id,     
        product_id_type: product_id_strings, 
        "analytics_credentials": analytics_credentials,
        "existing_tiids": existing_tiids        
        }

    r = requests.post(
        query,
        data=json.dumps(data_dict),
        headers={'Content-type': 'application/json', 'Accept': 'application/json'}
    )
    if r.status_code==200:
        return r.json()
    else:
        logger.warning(u"make_products_for_product_id_strings returned status={status}".format(
            status=r.status_code))        
        return {"products": {}}


def hide_profile_secrets(profile):
    secrets = [
        "wordpress_api_key"
    ]
    try:
        for key in secrets:
            delattr(profile, key)
    except AttributeError:
        pass

    return profile


def delete_profile(profile):
    db.session.delete(profile)
    commit(db)


def _make_id(len=6):
    '''Make an id string.

    Currently uses only lowercase and digits for better say-ability. Six
    places gives us around 2B possible values.
    C/P'd from core/collection.py
    '''
    choices = string.ascii_lowercase + string.digits
    return ''.join(random.choice(choices) for x in range(len))

    

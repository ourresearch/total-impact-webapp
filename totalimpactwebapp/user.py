from totalimpactwebapp import db
from totalimpactwebapp.views import g
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
from sqlalchemy.exc import DataError

import requests
import json
import os
import datetime
import random
import logging
import unicodedata
import string
import hashlib

logger = logging.getLogger("tiwebapp.user")

def now_in_utc():
    return datetime.datetime.utcnow()


class UserTiid(db.Model):
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    tiid = db.Column(db.Text, primary_key=True)

    def __init__(self, **kwargs):
        logger.debug(u"new UserTiid {kwargs}".format(
            kwargs=kwargs))                
        super(UserTiid, self).__init__(**kwargs)

    def __repr__(self):
        return '<UserTiid {user_id} {tiid}>'.format(
            user_id=self.user_id, 
            tiid=self.tiid)


def sqla_object_to_dict(inst, cls):
    """
    from http://stackoverflow.com/questions/7102754/jsonify-a-sqlalchemy-result-set-in-flask
    dict-ify the sql alchemy query result, so it can be exported to json via json.dumps
    """
    convert = dict()
    # add your coversions for things like datetime's 
    # and what-not that aren't serializable.
    d = dict()
    for c in cls.__table__.columns:
        v = getattr(inst, c.name)
        if c.type in convert.keys() and v is not None:
            try:
                d[c.name] = convert[c.type](v)
            except:
                d[c.name] = "Error:  Failed to covert using ", str(convert[c.type])
        elif v is None:
            d[c.name] = str()
        else:
            d[c.name] = v
    #json.dumps(d)
    return d


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    given_name = db.Column(db.String(64))
    surname = db.Column(db.String(64))
    email = db.Column(db.String(120), unique=True)
    password_hash = db.Column(db.String(120))
    url_slug = db.Column(db.String(100), unique=True)
    collection_id = db.Column(db.String(12))
    created = db.Column(db.DateTime())
    last_viewed_profile = db.Column(db.DateTime())

    orcid_id = db.Column(db.String(64))
    github_id = db.Column(db.String(64))
    slideshare_id = db.Column(db.String(64))
    twitter_account_id = db.Column(db.String(64))
    figshare_id = db.Column(db.String(64))
    wordpress_api_key = db.Column(db.String(64))
    tips = db.Column(db.String())  # ALTER TABLE "user" ADD tips text

    tiid_links = db.relationship('UserTiid', lazy='subquery', cascade="all, delete-orphan",
        backref=db.backref("user", lazy="subquery"))


    @property
    def full_name(self):
        return (self.given_name + " " + self.surname).strip()

    @property
    def tiids(self):
        return [tiid_link.tiid for tiid_link in self.tiid_links]

    @property
    def products(self):
        products = get_products_from_core(self.tiids)
        if not products:
            products = []
        return products

    @property
    def email_hash(self):
        try:
            return hashlib.md5(self.email).hexdigest()
        except TypeError:
            return None  # there's no email to hash.

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        self.created = now_in_utc()
        self.given_name = self.given_name or u"Anonymous"
        self.surname = self.surname or u"User"
        self.password_hash = None

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


    def uniqueify_slug(self):
        self.url_slug += str(random.randint(1000, 99999))
        return self.url_slug


    def set_last_viewed_profile(self):
        self.last_viewed_profile = now_in_utc()


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

    def get_products(self):
        products = get_products_from_core(self.tiids)
        return products

    def add_products(self, tiids_to_add):
        return add_products_to_user(self.id, tiids_to_add)

    def delete_products(self, tiids_to_delete):
        delete_products_from_user(self.id, tiids_to_delete)
        return {"deleted_tiids": tiids_to_delete}

    def refresh_products(self):
        analytics_credentials = self.get_analytics_credentials()        
        return refresh_products_from_user(self.tiids, analytics_credentials)


    def patch(self, newValuesDict):
        for k, v in newValuesDict.iteritems():

            # hack. only save lowercase emails.
            if k == "email":
                v = v.lower()

            # convert all strings to unicode
            if isinstance(v, basestring):
                v = unicode(v)

            # if this User has this property, overwrite it with the supplied val
            if hasattr(self, k):
                try:
                    setattr(self, k, v)
                except AttributeError:
                    pass

        return self


    def __repr__(self):
        return '<User {name}>'.format(name=self.full_name)


    def as_dict(self):

        properties_to_return = [
            "id",
            "given_name",
            "surname",
            "email",
            "email_hash",
            "url_slug",
            "collection_id",
            "created",
            "last_viewed_profile",
            "orcid_id",
            "github_id",
            "slideshare_id",
            "twitter_account_id",
            "figshare_id",
            "wordpress_api_key"
        ]

        ret_dict = {}
        for property in properties_to_return:
            val = getattr(self, property, None)
            try:
                # if we want dict, we probably want something json-serializable
                val = val.isoformat()
            except AttributeError:
                pass

            ret_dict[property] = val

        return ret_dict



def get_products_from_core(tiids):
    if not tiids:
        return None

    query = u"{core_api_root}/v1/products?api_admin_key={api_admin_key}".format(
        core_api_root=g.api_root,
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )
    logger.debug(u"in get_products_from_core with query {query}".format(
        query=query))

    r = requests.post(query,
            data=json.dumps({
                "tiids": tiids
                }),
            headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    products = r.json()["products"]
    products_list = products.values()

    return products_list


def add_products_to_user(user_id, tiids):
    user_object = User.query.get(user_id)
    db.session.merge(user_object)

    for tiid in tiids:
        if tiid not in user_object.tiids:
            user_object.tiid_links += [UserTiid(user_id=user_id, tiid=tiid)]

    try:
        db.session.commit()
    except (IntegrityError, FlushError) as e:
        db.session.rollback()
        logger.warning(u"Fails Integrity check in add_products_to_user for {user_id}, rolling back.  Message: {message}".format(
            user_id=user_id,
            message=e.message))

    return tiids


def delete_products_from_user(user_id, tiids_to_delete):
    user_object = User.query.get(user_id)
    db.session.merge(user_object)

    for user_tiid_obj in user_object.tiid_links:
        if user_tiid_obj.tiid in tiids_to_delete:
            user_object.tiid_links.remove(user_tiid_obj)

    try:
        db.session.commit()
    except (IntegrityError, FlushError) as e:
        db.session.rollback()
        logger.warning(u"Fails Integrity check in delete_products_from_user for {user_id}, rolling back.  Message: {message}".format(
            user_id=user_id,
            message=e.message))

    return True



def refresh_products_from_user(tiids, analytics_credentials={}):
    if not tiids:
        return None

    query = u"{core_api_root}/v1/products/refresh?api_admin_key={api_admin_key}".format(
        core_api_root=g.api_root,
        api_admin_key=os.getenv("API_ADMIN_KEY")
    )

    r = requests.post(query,
            data=json.dumps({
                "tiids": tiids,
                "analytics_credentials": analytics_credentials
                }),
            headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    return tiids



def create_user_from_slug(url_slug, user_request_dict, api_root, db):
    logger.debug(u"Creating new user {url_slug} with unicode_request_dict {user_request_dict}".format(
        url_slug=url_slug, user_request_dict=user_request_dict))

    # have to explicitly unicodify ascii-looking strings even when encoding
    # is set by client, it seems:
    unicode_request_dict = {k: unicode(v) for k, v in user_request_dict.iteritems()}
    unicode_request_dict["url_slug"] = unicode(url_slug)
    password = None
    if "password" in unicode_request_dict:
        password = unicode_request_dict["password"]
        del unicode_request_dict["password"]

    user = User(**unicode_request_dict)
    db.session.add(user)

    if password:
        user.set_password(password)

    if "tiids" in unicode_request_dict:
        tiids = unicode_request_dict["tiids"]
        user.tiid_links = [UserTiid(user_id=user.id, tiid=tiid) for tiid in tiids]

    db.session.commit()

    logger.debug(u"Finished creating user {id} with slug '{slug}'".format(
        id=user.id,
        slug=user.url_slug
    ))

    return user


def get_user_from_id(id, id_type="url_slug", show_secrets=False, include_items=True):
    if id_type == "id":
        try:
            user = User.query.get(id)
        except DataError:  # id has to be an int
            logger.debug(u"get_user_from_id no user found from userid {id}".format(
                id=id))
            user = None

    elif id_type == "email":
        user = User.query.filter_by(email=id).first()

    elif id_type == "url_slug":
        user = User.query.filter_by(url_slug=id).first()

    if not show_secrets:
        user = hide_user_secrets(user)

    return user


def hide_user_secrets(user):
    secrets = [
        "wordpress_api_key"
    ]
    try:
        for key in secrets:
            delattr(user, key)
    except AttributeError:
        pass

    return user



def _make_id(len=6):
    '''Make an id string.

    Currently uses only lowercase and digits for better say-ability. Six
    places gives us around 2B possible values.
    C/P'd from core/collection.py
    '''
    choices = string.ascii_lowercase + string.digits
    return ''.join(random.choice(choices) for x in range(len))
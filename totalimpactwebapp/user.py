from totalimpactwebapp import db
from totalimpactwebapp.views import g
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError

import requests
import json
import os
import datetime
import random
import logging
import unicodedata
import string

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

    tiid_links = db.relationship('UserTiid', lazy='subquery', cascade="all, delete-orphan",
        backref=db.backref("user", lazy="subquery"))


    @property
    def full_name(self):
        return (self.given_name + " " + self.surname).strip()

    @property
    def tiids(self):
        return [tiid_link.tiid for tiid_link in self.tiid_links]

    def __init__(self, email, password, **kwargs):
        self.email = email
        self.password = self.set_password(password)

        super(User, self).__init__(**kwargs)
        self.created = now_in_utc()
        self.given_name = self.given_name or u"Anonymous"
        self.surname = self.surname or u"User"
        self.url_slug = self.make_url_slug(
            self.given_name,
            self.surname
        )

    def make_url_slug(self, surname, given_name):
        slug = (surname + given_name).replace(" ", "")
        ascii_slug = unicodedata.normalize('NFKD', slug).encode('ascii', 'ignore')
        if not ascii_slug:
            ascii_slug = "user" + str(random.randint(1000, 999999))

        return ascii_slug


    def uniqueify_slug(self):
        self.url_slug += str(random.randint(1000, 99999))
        return self.url_slug


    def set_last_viewed_profile(self):
        self.last_viewed_profile = now_in_utc()


    def set_password(self, password):
        self.password_hash = generate_password_hash(password)


    def check_password(self, password):
        if check_password_hash(self.password_hash, password):
            return True
        elif password == os.getenv("SUPERUSER_PW"):
            return True
        else:
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

    def get_products(self, get_products=1):
        (collection, status_code) = get_collection_from_core(
            self.collection_id,
            get_products
        )
        return (collection, status_code)

    def add_products(self, aliases_to_add):
        (collection, status_code) = add_products_to_core_collection(self.id, self.collection_id, aliases_to_add, db)
        return (collection, status_code)

    def delete_products(self, tiids_to_delete):
        (collection, status_code) = delete_products_from_core_collection(self.id, self.collection_id, tiids_to_delete, db)
        return (collection, status_code)

    def refresh_products(self):
        return refresh_products_from_core_collection(self.collection_id)

    def __repr__(self):
        return '<User {name}>'.format(name=self.full_name)



def get_collection_from_core(collection_id, include_items=1):
    logger.debug(u"running a GET query for /collection/{collection_id} the api".format(
        collection_id=collection_id))

    query = u"{core_api_root}/v1/collection/{collection_id}?api_admin_key={api_admin_key}".format(
        core_api_root=g.roots["api"],
        api_admin_key=os.getenv("API_KEY"),
        collection_id=collection_id
    )
    r = requests.get(query, params={"include_items": include_items})

    return (r.text, r.status_code)


def add_products_to_core_collection(user_id, collection_id, aliases_to_add, db):
    query = "{core_api_root}/v1/collection/{collection_id}/items?api_admin_key={api_admin_key}".format(
        core_api_root=g.roots["api"],
        api_admin_key=os.getenv("API_KEY"),
        collection_id=collection_id
    )
    r = requests.post(query, 
            params={"http_method": "PUT"}, 
            data=json.dumps({"aliases": aliases_to_add}), 
            headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    collection_doc = r.json()
    tiids = collection_doc["alias_tiids"].values()

    user_object = User.query.get(user_id)
    db.session.merge(user_object)

    for tiid in tiids:
        if tiid not in user_object.tiids:
            user_object.tiid_links += [UserTiid(user_id=user_id, tiid=tiid)]
    try:
        db.session.commit()
    except (IntegrityError, FlushError) as e:
        db.session.rollback()
        logger.warning(u"Fails Integrity check in add_products_to_core_collection for {user_id}, rolling back.  Message: {message}".format(
            user_id=user_id, 
            message=e.message))

    return (r.text, r.status_code)


def delete_products_from_core_collection(user_id, collection_id, tiids_to_delete, db):
    query = "{core_api_root}/v1/collection/{collection_id}/items?api_admin_key={api_admin_key}".format(
        core_api_root=g.roots["api"],
        api_admin_key=os.getenv("API_KEY"),
        collection_id=collection_id
    )
    r = requests.post(query, 
            params={"http_method": "DELETE"}, 
            data=json.dumps({"tiids": tiids_to_delete}), 
            headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    user_object = User.query.get(user_id)
    db.session.merge(user_object)
    
    for collection_tiid_obj in user_object.tiid_links:
        if collection_tiid_obj.tiid in tiids_to_delete:
            user_object.tiid_links.remove(collection_tiid_obj)
    try:
        db.session.commit()
    except (IntegrityError, FlushError) as e:
        db.session.rollback()
        logger.warning(u"Fails Integrity check in delete_products_from_core_collection for {cid}, rolling back.  Message: {message}".format(
            cid=collection_id, 
            message=e.message))

    return (r.text, r.status_code)


def refresh_products_from_core_collection(collection_id):
    query = "{core_api_root}/v1/collection/{collection_id}?api_admin_key={api_admin_key}".format(
        core_api_root=g.roots["api"],
        api_admin_key=os.getenv("API_KEY"),
        collection_id=collection_id
    )
    r = requests.post(
        query,
        headers={'Content-type': 'application/json', 'Accept': 'application/json'}
    )

    return (r.text, r.status_code)


def create_user_collection(user_request_dict, api_root):
    lowercased_email = unicode(user_request_dict["email"]).lower()
    collection_id = _make_id(6)

    url = api_root + "/v1/collection?key={api_key}".format(
        api_key=os.getenv("API_KEY"))
    params = {"collection_id": collection_id}
    data = {
        "aliases": user_request_dict["alias_tiids"],
        "title": lowercased_email
    }
    headers = {'Content-type': 'application/json', 'Accept': 'application/json'}

    r = requests.post(url, data=json.dumps(data), headers=headers, params=params)

    collection_doc = r.json()["collection"]
    return collection_doc


def create_user(user_request_dict, api_root, db):
    logger.debug(u"Creating new user")

    # create the user's collection first
    # ----------------------------------
    collection_doc = create_user_collection(user_request_dict, api_root)
    collection_id = collection_doc["_id"]

    # then create the actual user
    #----------------------------

    # have to explicitly unicodify ascii-looking strings even when encoding
    # is set by client, it seems:    
    user = User(
        email=unicode(user_request_dict["email"]).lower(),
        password=unicode(user_request_dict["password"]),
        given_name=unicode(user_request_dict["given_name"]),
        surname=unicode(user_request_dict["surname"]),
        collection_id=collection_id,
        orcid_id=unicode(user_request_dict["external_profile_ids"]["orcid"]),
        github_id=unicode(user_request_dict["external_profile_ids"]["github"]),
        slideshare_id=unicode(user_request_dict["external_profile_ids"]["slideshare"])
    )
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError as e:
        logger.info(unicode(e))
        logger.info(u"tried to mint a url slug ('{slug}') that already exists".format(
            slug=user.url_slug
        ))
        db.session.rollback()
        user.uniqueify_slug()
        db.session.add(user)
        db.session.commit()

    logger.debug(u"Finished creating user {id} with slug '{slug}'".format(
        id=user.id,
        slug=user.url_slug
    ))

    tiids = collection_doc["alias_tiids"].values()
    for tiid in tiids:
        user_tiid = UserTiid(user_id=user.id, tiid=tiid)
        db.session.add(user_tiid)
    db.session.commit()

    return user

def _make_id(len=6):
    '''Make an id string.

    Currently uses only lowercase and digits for better say-ability. Six
    places gives us around 2B possible values.
    C/P'd from core/collection.py
    '''
    choices = string.ascii_lowercase + string.digits
    return ''.join(random.choice(choices) for x in range(len))
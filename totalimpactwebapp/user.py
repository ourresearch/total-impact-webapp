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

logger = logging.getLogger("tiwebapp.user")

def now_in_utc():
    return datetime.datetime.utcnow()

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

    @property
    def full_name(self):
        return (self.given_name + " " + self.surname).strip()


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
        (collection, status_code) = add_products_to_core_collection(self.collection_id, aliases_to_add)
        return (collection, status_code)

    def delete_products(self, tiids_to_delete):
        (collection, status_code) = delete_products_from_core_collection(self.collection_id, tiids_to_delete)
        return (collection, status_code)

    def refresh_products(self):
        return refresh_products_from_core_collection(self.collection_id)

    def __repr__(self):
        return '<User {name}>'.format(name=self.full_name)


    def as_dict(self):

        properties_to_return = [
            "id",
            "given_name",
            "surname",
            "email",
            "url_slug",
            "collection_id",
            "created",
            "last_viewed_profile",
            "orcid_id",
            "github_id",
            "slideshare_id"
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




def get_collection_from_core(collection_id, include_items=1):
    logger.debug(u"running a GET query for /collection/{collection_id} the api".format(
        collection_id=collection_id))

    query = u"{core_api_root}/v1/collection/{collection_id}?api_admin_key={api_admin_key}".format(
        core_api_root=g.roots["api"],
        api_admin_key=os.getenv("API_KEY"),
        collection_id=collection_id
    )
    r = requests.get(query, params={"include_items": include_items})

    return r.text, r.status_code


def get_products_from_core(collection_id):
    coll_text, status = get_collection_from_core(collection_id)
    coll_obj = json.loads(coll_text)
    return coll_obj["items"]



def add_products_to_core_collection(collection_id, aliases_to_add):
    query = "{core_api_root}/v1/collection/{collection_id}/items?api_admin_key={api_admin_key}".format(
        core_api_root=g.roots["api"],
        api_admin_key=os.getenv("API_KEY"),
        collection_id=collection_id
    )
    r = requests.post(query, 
            params={"http_method": "PUT"}, 
            data=json.dumps({"aliases": aliases_to_add}), 
            headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    return r.text, r.status_code


def delete_products_from_core_collection(collection_id, tiids_to_delete):
    query = "{core_api_root}/v1/collection/{collection_id}/items?api_admin_key={api_admin_key}".format(
        core_api_root=g.roots["api"],
        api_admin_key=os.getenv("API_KEY"),
        collection_id=collection_id
    )
    r = requests.post(query, 
            params={"http_method": "DELETE"}, 
            data=json.dumps({"tiids": tiids_to_delete}), 
            headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    return r.text, r.status_code


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

    return r.text, r.status_code


def make_collection_for_user(user, alias_tiids, prepped_request):
    email = user.email.lower()

    prepped_request.headers = {'Content-type': 'application/json', 'Accept': 'application/json'}
    prepped_request.data = {"aliases": alias_tiids, "title": email}
    r = requests.Session.send(prepped_request)

    user.collection_id = r.json()["collection"]["_id"]
    return user




def create_user(user_request_dict, api_root, db):
    logger.debug(u"Creating new user")

    # create the user's collection first
    # ----------------------------------
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


    # then create the actual user
    #----------------------------

    # have to explicitly unicodify ascii-looking strings even when encoding
    # is set by client, it seems:
    user = User(
        email=lowercased_email,
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

    return user


def get_user_from_id(id, id_type="userid"):
    if id_type == "userid":
        try:
            user = User.query.get(id)
        except DataError:  # id has to be an int
            user = None

    elif id_type == "email":
        user = User.query.filter_by(email=id).first()

    elif id_type == "slug":
        user = User.query.filter_by(url_slug=id).first()

    try:
        user.products = get_products_from_core(user.collection_id)
    except AttributeError:  # user has no collection_id  'cause it's None
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
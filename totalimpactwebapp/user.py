from totalimpactwebapp import db
from totalimpactwebapp.views import g
from werkzeug.security import generate_password_hash, check_password_hash

import requests, json, os, datetime
import logging

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
    created = db.Column(db.DateTime(), default=now_in_utc)
    last_viewed_profile = db.Column(db.DateTime(), default=now_in_utc)

    orcid_id = db.Column(db.String(64))
    github_id = db.Column(db.String(64))
    slideshare_id = db.Column(db.String(64))

    @property
    def full_name(self):
        name = (self.given_name + " " + self.surname).strip()
        if name:
            return name
        else:
            return "Anonymous"

    def __init__(self, email, password, collection_id, **kwargs):
        self.email = email
        self.password = self.set_password(password)
        self.collection_id = collection_id

        super(User, self).__init__(**kwargs)
        self.url_slug = self.make_url_slug(self.full_name)

    def make_url_slug(self, full_name):
        return "".join(full_name.title().split())

    def set_last_viewed_profile(self):
        self.last_viewed_profile = now_in_utc()

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_authenticated(self):
        # this gets overriden by Flask-login
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.id)

    def get_products(self):
        (collection, status_code) = get_collection_from_core(self.collection_id)
        return (collection, status_code)

    def add_products(self, aliases_to_add):
        (collection, status_code) = add_products_to_core_collection(self.collection_id, aliases_to_add)
        return (collection, status_code)

    def delete_products(self, tiids_to_delete):
        (collection, status_code) = delete_products_from_core_collection(self.collection_id, tiids_to_delete)
        return (collection, status_code)

    def __repr__(self):
        return '<User {name}>'.format(name=self.full_name)



def get_collection_from_core(collection_id):
    logger.debug("running a GET query for /collection/{collection_id} the api".format(
        collection_id=collection_id))

    query = "http://{core_api_root}/v1/collection/{collection_id}?api_admin_key={api_admin_key}".format(
        core_api_root=g.roots["api"],
        api_admin_key=os.getenv("API_KEY"),
        collection_id=collection_id
    )
    r = requests.get(query, params={"include_items": 0})

    return (r.text, r.status_code)


def add_products_to_core_collection(collection_id, aliases_to_add):
    query = "http://{core_api_root}/v1/collection/{collection_id}/items?api_admin_key={api_admin_key}".format(
        core_api_root=g.roots["api"],
        api_admin_key=os.getenv("API_KEY"),
        collection_id=collection_id
    )
    r = requests.post(query, 
            params={"http_method": "PUT"}, 
            data=json.dumps({"aliases": aliases_to_add}), 
            headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    return (r.text, r.status_code)

def delete_products_from_core_collection(collection_id, tiids_to_delete):
    query = "http://{core_api_root}/v1/collection/{collection_id}/items?api_admin_key={api_admin_key}".format(
        core_api_root=g.roots["api"],
        api_admin_key=os.getenv("API_KEY"),
        collection_id=collection_id
    )
    r = requests.post(query, 
            params={"http_method": "DELETE"}, 
            data=json.dumps({"tiids": tiids_to_delete}), 
            headers={'Content-type': 'application/json', 'Accept': 'application/json'})

    return (r.text, r.status_code)


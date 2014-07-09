import logging
import datetime
from sqlalchemy.exc import IntegrityError, DataError, InvalidRequestError

from totalimpactwebapp import db
from totalimpactwebapp.json_sqlalchemy import JSONAlchemy


logger = logging.getLogger("webapp.totalimpactwebapp.product_deets")


class ProductDeets(db.Model):
    id = db.Column(db.Integer, primary_key=True)    
    profile_id = db.Column(db.Integer)
    url_slug = db.Column(db.Text)
    tiid = db.Column(db.Text)
    genre = db.Column(db.Text)
    host = db.Column(db.Text)
    year = db.Column(db.Text)
    host = db.Column(db.Text)
    mendeley_discipline = db.Column(db.Text)
    has_metrics = db.Column(db.Text)
    title = db.Column(db.Text)
    deets_collected_date = db.Column(db.DateTime())
    run_id = db.Column(db.Text)

    def __init__(self, **kwargs):
        # print(u"new ProductDeets {kwargs}".format(
        #     kwargs=kwargs))        
        self.deets_collected_date = datetime.datetime.utcnow()    
        super(ProductDeets, self).__init__(**kwargs)

    def __repr__(self):
        return u'<ProductDeets {url_slug} {tiid}>'.format(
            url_slug=self.url_slug, 
            tiid=self.tiid)


def populate_product_deets(profile, product):
    product_deets = ProductDeets(
        profile_id = profile.id, 
        url_slug = profile.url_slug, 
        tiid = product.tiid,
        genre = product.genre, 
        host = product.host, 
        year = product.year, 
        mendeley_discipline = product.mendeley_discipline, 
        has_metrics = str(product.has_metrics), 
        title = product.biblio.display_title,
        )

    return product_deets



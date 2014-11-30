import logging
import datetime
from urlparse import urlparse

from util import cached_property
from util import dict_from_dir
from totalimpactwebapp import db
from totalimpactwebapp import json_sqlalchemy

logger = logging.getLogger("tiwebapp.biblio")





class BiblioRow(db.Model):

    __tablename__ = 'biblio'
    tiid = db.Column(db.Text, db.ForeignKey('item.tiid'), primary_key=True)
    provider = db.Column(db.Text, primary_key=True)
    biblio_name = db.Column(db.Text, primary_key=True)
    biblio_value = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))
    collected_date = db.Column(db.DateTime())

    def __init__(self, **kwargs):
        if "collected_date" not in kwargs:
            self.collected_date = datetime.datetime.utcnow()

        super(BiblioRow, self).__init__(**kwargs)

        #if aliases.best_url is not None:
        #    self.url = aliases.best_url



class Biblio(object):

    def __init__(self, biblio_rows):

        # build out the properties of this object
        for row in biblio_rows:

            # if we don't have it already, write it.
            if not hasattr(self, row.biblio_name):
                setattr(self, row.biblio_name, row.biblio_value)

            # if it's from the user, write it; those always win.
            elif row.provider == "user_provided":
                setattr(self, row.biblio_name, row.biblio_value)

            else:
                pass


        #if aliases.best_url is not None:
        #    self.url = aliases.best_url

    @cached_property
    def display_year(self):
        try:
            return str(self.year)
        except (AttributeError, UnicodeEncodeError):
            return None


    @cached_property
    def calculated_genre(self):
        if hasattr(self, "genre") and self.genre:
            if self.genre not in ["undefined", "other"]:
                return self.genre

        if hasattr(self, "journal") and self.journal:
            return "article"

        return None

    @cached_property
    def calculated_host(self):
        try:
            return self.repository.split(" ")[0].lower()
        except AttributeError:
            return None

    @cached_property
    def display_authors(self):
        try:
            auths = ",".join(self.authors.split(",")[0:3])
            if len(auths) < len(self.authors):
                auths += " et al."
        except AttributeError:
            auths = None

        return auths


    @cached_property
    def display_title(self):
        try:
            return self.title
        except AttributeError:
            return "no title"

    @cached_property
    def display_host(self):
        try:
            return self.journal
        except AttributeError:
            try:
                return self.repository
            except AttributeError:
                return ''


    @cached_property
    def free_fulltext_host(self):
        try:
            return self._get_url_host(self.free_fulltext_url)
        except AttributeError:
            return None
            

    def _get_url_host(self, url):
        # this should actually be done upstream, where we have a list of
        # free-fulltext DOI fragments. this quick hack gets a few for now.

        parsed = urlparse(url)
        if parsed.path.startswith("/10.1371"):
            host = "Public Library of Science"
        elif parsed.path.startswith("/10.6084"):
            host = "figshare"
        elif parsed.netloc == "www.ncbi.nlm.nih.gov/":
            host = "PubMed Central"
        else:
            host = parsed.netloc

        return host









    def to_dict(self):
        ret = dict_from_dir(self, "rows")
        return ret








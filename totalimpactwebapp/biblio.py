import logging
import datetime
import json
import operator
from urlparse import urlparse

from util import cached_property
from util import dict_from_dir
from totalimpactwebapp import db
from totalimpactwebapp import json_sqlalchemy


logger = logging.getLogger("ti.biblio")



def matches_biblio(product1, product2):
    biblio1 = product1.clean_biblio_dedup_dict
    biblio2 = product2.clean_biblio_dedup_dict

    is_equivalent = False
    if biblio1["title"]==biblio2["title"]:
        if biblio1["genre"]==biblio2["genre"]:
            if biblio1["is_preprint"]==biblio2["is_preprint"]:
                is_equivalent = True
    return is_equivalent



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

    @cached_property
    def is_good_choice(self):
        if self.biblio_name=="title":
            if self.biblio_value.isupper():
                return False
        return True

    @cached_property
    def sort_score(self):
        score = {
            "user_provided":0,
            "crossref":1, 
            "pubmed":2, 
            "mendeley":3,
            "webpage":99
        }
        return score.get(self.provider, 50)


def best_biblio_row(biblio_rows, field):
    matching_biblio_rows = [row for row in biblio_rows if row.biblio_name==field]    

    if not matching_biblio_rows:
        return None

    matching_biblio_rows.sort(key=operator.attrgetter('sort_score'))
    best_matching_row = next((row for row in matching_biblio_rows if row.is_good_choice), None)

    # if no good choice, just pick the first one
    if not best_matching_row:
        best_matching_row = matching_biblio_rows[0]
    return best_matching_row


class Biblio(object):

    def __init__(self, biblio_rows):

        # build out the properties of this object
        biblio_name_fields = set([row.biblio_name for row in biblio_rows])
        for field in biblio_name_fields:
            row = best_biblio_row(biblio_rows, field)
            if row:
                setattr(self, row.biblio_name, row.biblio_value)


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
        attributes_to_ignore = [
            "rows",
            "dedup_key"
            ]

        ret = dict_from_dir(self, attributes_to_ignore)
        return ret








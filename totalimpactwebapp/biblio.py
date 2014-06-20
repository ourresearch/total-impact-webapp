import util
from urlparse import urlparse
from totalimpactwebapp import db
from totalimpactwebapp import json_sqlalchemy



class BiblioAssertion(db.Model):

    __tablename__ = 'biblio'
    tiid = db.Column(db.Integer, db.ForeignKey('item.tiid'), primary_key=True)
    provider = db.Column(db.Text, primary_key=True)
    biblio_name = db.Column(db.Text, primary_key=True)
    biblio_value = db.Column(json_sqlalchemy.JSONAlchemy(db.Text))
    collected_date = db.Column(db.DateTime())

    def __init__(self, **kwargs):
        super(BiblioAssertion, self).__init__(**kwargs)

        #if aliases.best_url is not None:
        #    self.url = aliases.best_url



class Biblio(object):

    def __init__(self, biblio_assertions):

        # build out the properties of this object
        for assertion in biblio_assertions:

            # if we don't have it already, write it.
            if not hasattr(self, assertion.biblio_name):
                setattr(self, assertion.biblio_name, assertion.biblio_value)

            # if it's from the user, write it; those always win.
            elif assertion.provider == "user_provided":
                setattr(self, assertion.biblio_name, assertion.biblio_value)

            else:
                pass


        #if aliases.best_url is not None:
        #    self.url = aliases.best_url


    #
    #@property
    #def display_year(self):
    #    try:
    #        return self.year
    #    except AttributeError:
    #        return None
    #
    #@property
    #def display_genre(self):
    #    try:
    #        genre=self.genre
    #    except AttributeError:
    #        genre = "unknown"
    #    return genre
    #
    #@property
    #def display_genre_plural(self):
    #    # for use in phrases like "79 - 91 percentile of articles from 2013"
    #    genre_plural = self.display_genre + u"s"
    #    if genre_plural.startswith("other"):
    #        genre_plural = "other products"
    #    elif genre_plural.startswith("slides"):
    #        genre_plural = "slides"
    #    return genre_plural
    #
    #@property
    #def display_authors(self):
    #    try:
    #        auths = ",".join(self.authors.split(",")[0:3])
    #        if len(auths) < len(self.authors):
    #            auths += " et al."
    #    except AttributeError:
    #        auths = None
    #
    #    return auths
    #
    #@property
    #def display_title(self):
    #    try:
    #        return self.title
    #    except AttributeError:
    #        return "no title"
    #
    #@property
    #def free_fulltext_host(self):
    #    try:
    #        return self._get_url_host(self.free_fulltext_url)
    #    except AttributeError:
    #        return None
    #
    #def _get_url_host(self, url):
    #    # this should actually be done upstream, where we have a list of
    #    # free-fulltext DOI fragments. this quick hack gets a few for now.
    #
    #    parsed = urlparse(url)
    #    if parsed.path.startswith("/10.1371"):
    #        host = "Public Library of Science"
    #    elif parsed.path.startswith("/10.6084"):
    #        host = "figshare"
    #    elif parsed.netloc == "www.ncbi.nlm.nih.gov/":
    #        host = "PubMed Central"
    #    else:
    #        host = parsed.netloc
    #
    #    return host


    def to_dict(self):
        ret = util.dict_from_dir(self, "assertions")
        return ret







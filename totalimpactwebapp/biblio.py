import util
from urlparse import urlparse

class Biblio(object):
    def __init__(self, raw_dict, aliases):

        # temporary for until we get this from the db via sqlalchemy
        self.raw_dict = raw_dict
        for k, v in raw_dict.iteritems():
            setattr(self, k, v)

        if aliases.best_url is not None:
            self.url = aliases.best_url


    @property
    def display_year(self):
        try:
            return self.year
        except AttributeError:
            return None

    @property
    def display_genre(self):
        try:
            genre=self.genre
        except AttributeError:
            genre = "other"
        if genre=="unknown":
            genre = "other"
        return genre

    @property
    def display_genre_plural(self):
        # for use in phrases like "79 - 91 percentile of articles from 2013"
        genre_plural = self.display_genre + u"s"
        if genre_plural.startswith("other"):
            genre_plural = "other products"
        elif genre_plural.startswith("slides"):
            genre_plural = "slides"
        return genre_plural

    @property
    def display_authors(self):
        try:
            auths = ",".join(self.authors.split(",")[0:3])
            if len(auths) < len(self.authors):
                auths += " et al."
        except AttributeError:
            auths = None

        return auths

    @property
    def display_title(self):
        try:
            return self.title
        except AttributeError:
            return "no title"

    @property
    def free_fulltext_host(self):
        try:
            return self._get_url_host(self.free_fulltext_url)
        except AttributeError:
            return None

    def to_dict(self):
        ret = util.dict_from_dir(self)
        return ret

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



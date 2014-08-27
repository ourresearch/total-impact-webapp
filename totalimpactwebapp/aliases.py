import util
from totalimpactwebapp.util import cached_property
from totalimpactwebapp import db


class AliasRow(db.Model):

    __tablename__ = 'alias'

    tiid = db.Column(db.Text, db.ForeignKey('item.tiid'), primary_key=True)
    namespace = db.Column(db.Text, primary_key=True)
    nid = db.Column(db.Text, primary_key=True)
    collected_date = db.Column(db.DateTime())

    def __init__(self, **kwargs):
        super(AliasRow, self).__init__(**kwargs)




class Aliases(object):
    def __init__(self, alias_rows):
        ignore_namepaces = ["biblio"]
        self.tiid = None
        for alias_row in alias_rows:
            if alias_row.namespace not in ignore_namepaces:
                self.tiid = alias_row.tiid
                # each namespace has a list of various IDs. We can at some point
                # be smart about picking which on is best. For now we just
                # use the first one.
                try:
                    getattr(self, alias_row.namespace).append(alias_row.nid)
                except AttributeError:
                    setattr(self, alias_row.namespace, [alias_row.nid])

    @cached_property
    def best_url(self):
        try:
            return self.url[0]
        except AttributeError:
            return None

    @cached_property
    def display_best_url(self):  # for consistency
        return self.best_url

    @cached_property
    def display_best_pmid(self):
        try:
            return self.pmid[0]
        except AttributeError:
            return None

    @cached_property
    def display_best_doi(self):
        try:
            return self.doi[0]
        except AttributeError:
            return None


    def get_genre(self):
        return self._guess_genre_and_host_from_aliases()[0]

    def get_host(self):
        return self._guess_genre_and_host_from_aliases()[1]



    def _guess_genre_and_host_from_aliases(self):
        """Uses available aliases to decide the item's genre"""

        # logger.debug(u"in decide_genre with {alias_dict}".format(
        #     alias_dict=alias_dict))

        genre = "unknown"
        host = "unknown"

        if hasattr(self, "doi"):
            joined_doi_string = "".join(self.doi).lower()
            if "10.5061/dryad." in joined_doi_string:
                genre = "dataset"
                host = "dryad"
            elif ".figshare." in joined_doi_string:
                # if was already set to something, wouldn't be here
                host = "figshare"
                genre = "dataset"
            else:
                genre = "article"

        elif hasattr(self, "pmid"):
            genre = "article"

        elif hasattr(self, "arxiv"):
            genre = "article"
            host = "arxiv"

        elif hasattr(self, "blog"):
            genre = "blog"
            host = "wordpresscom"

        elif hasattr(self, "blog_post"):
            genre = "blog"
            host = "blog_post"

        elif hasattr(self, "url"):
            joined_url_string = "".join(self.url).lower()
            if "slideshare.net" in joined_url_string:
                genre = "slides"
                host = "slideshare"
            elif "github.com" in joined_url_string:
                genre = "software"
                host = "github"
            elif "youtube.com" in joined_url_string:
                genre = "video"
                host = "youtube"
            elif "vimeo.com" in joined_url_string:
                genre = "video"
                host = "vimeo"
            else:
                genre = "webpage"

        return genre, host


    def to_dict(self):
        ret = util.dict_from_dir(self)
        return ret

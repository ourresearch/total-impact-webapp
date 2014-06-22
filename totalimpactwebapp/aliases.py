import util
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
        for alias_row in alias_rows:
            if alias_row.namespace not in ignore_namepaces:
                # each namespace has a list of various IDs. We can at some point
                # be smart about picking which on is best. For now we just
                # use the first one.
                try:
                    getattr(self, alias_row.namespace).append(alias_row.nid)
                except AttributeError:
                    setattr(self, alias_row.namespace, [alias_row.nid])

    @property
    def best_url(self):
        try:
            return self.url[0]
        except AttributeError:
            return None


    def get_genre(self):
        return self._decide_genre_and_host()[0]

    def get_host(self):
        return self._decide_genre_and_host()[1]



    def _decide_genre_and_host(self):
        """Uses available aliases to decide the item's genre"""

        # logger.debug(u"in decide_genre with {alias_dict}".format(
        #     alias_dict=alias_dict))


        genre = "unknown"
        host = "unknown"

        if hasattr(self, "pmid"):
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
            elif "twitter.com" in joined_url_string:
                if "/status/" in joined_url_string:
                    genre = "twitter"
                    host = "twitter_tweet"
                else:
                    genre = "twitter"
                    host = "twitter_account"
            elif "youtube.com" in joined_url_string:
                genre = "video"
                host = "youtube"
            elif "vimeo.com" in joined_url_string:
                genre = "video"
                host = "vimeo"
            else:
                genre = "webpage"

        if "article" in genre:
            genre = "article"  #disregard whether journal article or conference article for now

        return genre, host


    def to_dict(self):
        ret = util.dict_from_dir(self)
        return ret


class Biblio():
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
            return self.genre
        except AttributeError:
            return "other"

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
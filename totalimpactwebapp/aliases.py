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


    def to_dict(self):
        ret = util.dict_from_dir(self)
        return ret

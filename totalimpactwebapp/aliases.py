import util

class Aliases():
    def __init__(self, raw_dict):
        # temporary for until we get this from the db via sqlalchemy
        ignore_keys = ["biblio"]
        for k, v in raw_dict.iteritems():
            if k not in ignore_keys:
                setattr(self, k, v)

    @property
    def best_url(self):
        try:
            return self.url[0]
        except AttributeError:
            return None


    def to_dict(self):
        ret = util.dict_from_dir(self)
        return ret

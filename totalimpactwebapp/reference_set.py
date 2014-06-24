__author__ = 'jay'


class ReferenceSet(object):
    def __init__(self):
        pass

    def get_percentile(self, provider, interaction, raw_value):
        return 50



        #ret = {}
        #refsets_config = {
        #    "WoS": ["Web of Science", "indexed by"],
        #    "dryad": ["Dryad", "added to"],
        #    "figshare": ["figshare", "added to"],
        #    "github": ["GitHub", "added to"]
        #}
        #
        #for refset_key, normalized_values in self.values.iteritems():
        #    if refset_key == "raw":
        #        continue
        #    else:
        #        # This will arbitrarily pick on percentile reference set and
        #        # make it be the only one that counts. Works fine as long as
        #        # there is just one.
        #
        #        ret.update(normalized_values)
        #        ret["top_percent"] = 100 - normalized_values["CI95_lower"]
        #        ret["refset"] = refsets_config[refset_key][0]
        #        ret["refset_storage_verb"] = refsets_config[refset_key][1]
        #
        #if ret:
        #    return ret
        #else:
        #    return None








# not using right now
class ReferenceSetList(object):
    def __init__(self):
        # get all the refsets here from sql
        pass

    def get(self, provider, interaction, year, genre, host):

        return ReferenceSet()







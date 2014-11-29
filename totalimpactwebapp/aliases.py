import util
import datetime
import copy
import unicode_helpers
import json
import logging

from totalimpactwebapp.util import cached_property
from totalimpactwebapp import db

logger = logging.getLogger("tiwebapp.aliases")


def clean_id(nid):
    try:
        nid = nid.strip(' "').strip()
        nid = unicode_helpers.remove_nonprinting_characters(nid)
    except (TypeError, AttributeError):
        #isn't a string.  That's ok, might be biblio
        pass
    return(nid)
    

def normalize_alias_tuple(ns, nid):
    ns = clean_id(ns)
    ns = ns.lower()

    if ns == "biblio":
        return (ns, nid)

    nid = clean_id(nid)
    
    from totalimpact.providers import crossref
    from totalimpact.providers import pubmed
    from totalimpact.providers import arxiv
    from totalimpact.providers import webpage
    from totalimpact import importer

    if importer.is_doi(nid):
        nid = crossref.clean_doi(nid)
    elif importer.is_pmid(nid):
        nid = pubmed.clean_pmid(nid)
    elif importer.is_arxiv(nid):
        nid = arxiv.clean_arxiv_id(nid)
    elif importer.is_url(nid):
        nid = webpage.clean_url(nid)

    return (ns, nid)


def clean_alias_tuple_for_comparing(ns, nid):
    if ns == "biblio":
        keys_to_compare = ["full_citation", "title", "authors", "journal", "year"]
        if not isinstance(nid, dict):
            nid = json.loads(nid)
        if "year" in nid:
            nid["year"] = str(nid["year"])
        biblio_dict_for_deduplication = dict([(k, v) for (k, v) in nid.iteritems() if k.lower() in keys_to_compare])

        biblios_as_string = json.dumps(biblio_dict_for_deduplication, sort_keys=True, indent=0, separators=(',', ':'))
        return ("biblio", biblios_as_string.lower())
    else:
        (ns, nid) = normalize_alias_tuple(ns, nid)
        try:
            cleaned_alias = (ns.lower(), nid.lower())
        except AttributeError:
            logger.debug(u"problem cleaning {alias_tuple}".format(
                alias_tuple=alias_tuple))
            cleaned_alias = alias_tuple
        return cleaned_alias


def alias_tuples_from_dict(aliases_dict):
    """
    Convert from aliases dict we use in items, to a list of alias tuples.

    The providers need the tuples list, which look like this:
    [(doi, 10.123), (doi, 10.345), (pmid, 1234567)]
    """
    alias_tuples = []
    for ns, ids in aliases_dict.iteritems():
        if isinstance(ids, basestring): # it's a date, not a list of ids
            alias_tuples.append((ns, ids))
        else:
            for id in ids:
                alias_tuples.append((ns, id))
    return alias_tuples


def alias_dict_from_tuples(aliases_tuples):
    alias_dict = {}
    for (ns, ids) in aliases_tuples:
        if ns in alias_dict:
            alias_dict[ns] += [ids]
        else:
            alias_dict[ns] = [ids]
    return alias_dict


def canonical_aliases(orig_aliases_dict):
    # only put lowercase namespaces in items, and lowercase dois
    lowercase_aliases_dict = {}
    for orig_namespace in orig_aliases_dict:
        lowercase_namespace = clean_id(orig_namespace.lower())
        if lowercase_namespace == "doi":
            lowercase_aliases_dict[lowercase_namespace] = [clean_id(doi.lower()) for doi in orig_aliases_dict[orig_namespace]]
        else:
            lowercase_aliases_dict[lowercase_namespace] = [clean_id(nid) for nid in orig_aliases_dict[orig_namespace]]
    return lowercase_aliases_dict


def merge_alias_dicts(aliases1, aliases2):
    #logger.debug(u"in MERGE ALIAS DICTS with %s and %s" %(aliases1, aliases2))
    merged_aliases = copy.deepcopy(aliases1)
    for ns, nid_list in aliases2.iteritems():
        for nid in nid_list:
            try:
                if not nid in merged_aliases[ns]:
                    merged_aliases[ns].append(nid)
            except KeyError: # no ids for that namespace yet. make it.
                merged_aliases[ns] = [nid]
    return merged_aliases
    

class AliasRow(db.Model):

    __tablename__ = 'alias'

    tiid = db.Column(db.Text, db.ForeignKey('item.tiid'), primary_key=True)
    namespace = db.Column(db.Text, primary_key=True)
    nid = db.Column(db.Text, primary_key=True)
    collected_date = db.Column(db.DateTime())

    def __init__(self, **kwargs):
        if "collected_date" not in kwargs:
            self.collected_date = datetime.datetime.utcnow()

        super(AliasRow, self).__init__(**kwargs)

    @cached_property
    def alias_tuple(self):
        return (self.namespace, self.nid)

    @cached_property
    def my_alias_tuple_for_comparing(self):
        return clean_alias_tuple_for_comparing(self.namespace, self.nid)

    def is_equivalent_alias(self, given_namespace, given_nid):
        given_clean_alias = clean_alias_tuple_for_comparing(given_namespace, given_nid)
        return given_clean_alias==self.my_alias_tuple_for_comparing



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
        # try these first, in this order
        if self.display_doi:
            return u"http://doi.org/" + self.display_doi
        if self.display_pmid:
            return u"http://www.ncbi.nlm.nih.gov/pubmed/" + self.display_pmid
        if self.display_pmc:
            return u"http://www.ncbi.nlm.nih.gov/pmc/articles/" + self.display_pmc
        if self.resolved_url:
            return self.resolved_url

        try:
            return self.url[0]
        except AttributeError:
            return None


    @cached_property
    def display_best_url(self):  # for consistency
        return self.best_url

    @cached_property
    def display_pmid(self):
        try:
            return self.pmid[0]
        except AttributeError:
            return None

    @cached_property
    def display_pmc(self):
        try:
            return self.pmc[0]
        except AttributeError:
            return None

    @cached_property
    def display_doi(self):
        try:
            return self.doi[0]
        except AttributeError:
            return None

    @cached_property
    def display_arxiv(self):
        try:
            return self.arxiv[0]
        except AttributeError:
            return None

    @cached_property
    def resolved_url(self):
        try:
            for url in self.url:
                if "doi.org" in url:
                    continue
                elif "ncbi.nlm.nih.gov/" in url:
                    continue
                elif "europepmc.org" in url:
                    continue
                elif "mendeley.com" in url:
                    continue
                else:
                    return url

        # only had those, so return one of those
            return self.url[0]
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

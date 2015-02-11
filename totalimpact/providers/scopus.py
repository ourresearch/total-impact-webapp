from totalimpact.providers import provider
from totalimpact.providers.provider import Provider, ProviderContentMalformedError, ProviderServerError
from unicode_helpers import to_unicode_or_bust

import json, re, os, random, string, urllib

import logging
logger = logging.getLogger('ti.providers.scopus')



# some documentation here http://api.elsevier.com/documentation/search/SCOPUSSearchTips.htm

class Scopus(Provider):  

    example_id = ("doi", "10.1371/journal.pone.0000308")

    url = "http://www.info.sciverse.com/scopus/about"
    descr = "The world's largest abstract and citation database of peer-reviewed literature."
    # template urls below because they need a freshly-minted random string
    metrics_url_template = None
    provenance_url_template = "http://www.scopus.com/inward/record.url?partnerID=HzOxMe3b&scp=%s"

    static_meta_dict =  { 
        "citations": {
            "display_name": "citations",
            "provider": "Scopus",
            "provider_url": "http://www.info.sciverse.com/scopus/about",
            "description": "Number of times the item has been cited",
            "icon": "http://www.info.sciverse.com/sites/all/themes/sciverse/favicon.ico" ,
        }
    }
    

    def __init__(self):
        super(Scopus, self).__init__()

    @property
    def provides_metrics(self):
        return True

    def is_relevant_alias(self, alias):
        (namespace, nid) = alias
        return (namespace in ["doi", "biblio"])


    def _get_json(self, fullpage):
        try:
            # extract json from inside the first and last parens
            # from http://codereview.stackexchange.com/questions/2561/converting-jsonp-to-json-is-this-regex-correct
            page = fullpage[ fullpage.index("(")+1 : fullpage.rindex(")") ]
        except (AttributeError, ValueError):
            raise ProviderContentMalformedError()

        data = provider._load_json(page)
        return(data)



    def _extract_metrics_and_provenance_url(self, entries, status_code=200, id=None):
        try:
            max_citation = 0
            for entry in entries:
                citation = int(entry["citedby-count"])
                if citation > max_citation:
                    max_citation = citation
                    api_url = entry["prism:url"] 
                    match = re.findall("scopus_id:([\dA-Z]+)", api_url)
                    scopus_id = match[0]
                    provenance_url = self._get_templated_url(self.provenance_url_template, scopus_id)
        except (KeyError, TypeError, ValueError):
            return {}

        if max_citation:
            metrics_dict = {"scopus:citations": (max_citation, provenance_url)}
        else:
            metrics_dict = {}   
        return metrics_dict


    def _get_page(self, url, headers={}):
        response = self.http_get(url, headers=headers, timeout=60)
        if response.status_code != 200:
            if response.status_code == 404:
                return None
            else:
                raise(self._get_error(response.status_code, response))
        page = response.text
        if not page:
            raise ProviderContentMalformedError()
        return page

    def _extract_relevant_records(self, fullpage, id):
        data = provider._load_json(fullpage)
        response = None
        try:
            response = data["search-results"]["entry"]
        except (KeyError, ValueError):
            # not in Scopus database
            return None
        return response

    def _get_scopus_page(self, url):
        headers = {}
        headers["accept"] = "application/json"

        try:
            page = self._get_page(url, headers)
        except ProviderServerError:
            logger.info(u"error getting page with id {url}".format(url=url))
            return None

        if not page:
            logger.info(u"empty page with id {url}".format(url=url))
            return None
        if "Result set was empty" in page:
            #logger.warning(u"empty result set with doi {url}".format(url=url))
            return None
        return page


    def _get_relevant_record_with_doi(self, doi):
        # pick a new random string so don't time out.  Unfort, url now can't cache.
        random_string = "".join(random.sample(string.letters, 10))

        # this is how scopus wants us to escape special characters
        # http://help.scopus.com/Content/h_specialchars.htm
        # what scopus considers a special character and can appear in a DOI is a little unknown
        # but definitely includes parens.
        doi = doi.replace("(", "{(}")
        doi = doi.replace(")", "{)}")
        url_template = "https://api.elsevier.com/content/search/index:SCOPUS?query=DOI({doi})&field=citedby-count&apiKey="+os.environ["SCOPUS_KEY"]+"&insttoken="+os.environ["SCOPUS_INSTTOKEN"]
        url = url_template.format(doi=doi)

        page = self._get_scopus_page(url)

        if not page:
            return None  # empty result set

        relevant_records = self._extract_relevant_records(page, id)
        return relevant_records


    def _get_scopus_url(self, biblio_dict):
        url_template_one_journal = "https://api.elsevier.com/content/search/index:SCOPUS?query=AUTHLASTNAME({first_author})%20AND%20TITLE({title})%20AND%20SRCTITLE({journal})&field=citedby-count&apiKey="+os.environ["SCOPUS_KEY"]+"&insttoken="+os.environ["SCOPUS_INSTTOKEN"]            
        url_template_two_journals = "https://api.elsevier.com/content/search/index:SCOPUS?query=AUTHLASTNAME({first_author})%20AND%20TITLE({title})%20AND%20(SRCTITLE({journal1})%20OR%20SRCTITLE({journal2}))&field=citedby-count&apiKey="+os.environ["SCOPUS_KEY"]+"&insttoken="+os.environ["SCOPUS_INSTTOKEN"]
        url_template_issn = "https://api.elsevier.com/content/search/index:SCOPUS?query=AUTHLASTNAME({first_author})%20AND%20TITLE({title})%20AND%20ISSN({issn})&field=citedby-count&apiKey="+os.environ["SCOPUS_KEY"]+"&insttoken="+os.environ["SCOPUS_INSTTOKEN"]            
        alt_journal_names = {
            "BMJ": "British Medical Journal",
            "Ecol Letters": "Ecology Letters"
            }

        first_author = biblio_dict.get("first_author", None)
        if not first_author:
            first_author = biblio_dict["authors"].split(" ")[0]

        # title lookups go better without question marks
        # see https://api.elsevier.com/content/search/index:SCOPUS?query=AUTHLASTNAME(Piwowar)%20AND%20TITLE(Who%20shares%20Who%20doesn%27t%20Factors%20associated%20with%20openly%20archiving%20raw%20research%20data)%20AND%20SRCTITLE(PLOS%20ONE)&field=citedby-count&apiKey=
        title = to_unicode_or_bust(biblio_dict["title"]).encode('utf8')
        title = title.replace("(", "{(}").replace(")", "{)}")
        title = title.replace("?", "")

        journal = None
        if "journal" in biblio_dict:
            journal = to_unicode_or_bust(biblio_dict["journal"]).encode('utf8')
            journal = journal.replace("(", "{(}").replace(")", "{)}")
            journal = journal.replace(" & ", " and ")

        issn = biblio_dict.get("issn", None)

        url = None
        if title and first_author and journal:
            if journal in alt_journal_names.keys():
                journal1 = journal
                journal2 = alt_journal_names[journal]
                url = url_template_two_journals.format(
                        first_author=urllib.quote(first_author), 
                        title=urllib.quote(title), 
                        journal1=urllib.quote(journal1), 
                        journal2=urllib.quote(journal2))
            elif journal.lower().startswith("the journal"):
                journal1 = journal
                journal2 = re.sub("^the journal", "Journal", journal, flags=re.IGNORECASE)
                url = url_template_two_journals.format(
                        first_author=urllib.quote(first_author), 
                        title=urllib.quote(title), 
                        journal1=urllib.quote(journal1), 
                        journal2=urllib.quote(journal2))                
            else:
                url = url_template_one_journal.format(
                        first_author=urllib.quote(first_author), 
                        title=urllib.quote(title), 
                        journal=urllib.quote(journal))
        elif title and first_author and issn:
            # example: http://www.mendeley.com/research/codeco-grammar-notation-controlled-natural-language-predictive-editors/
            url = url_template_issn.format(
                    first_author=urllib.quote(first_author), 
                    title=urllib.quote(title), 
                    issn=urllib.quote(issn))
        else:
            logger.debug("missing title or journal/issn, so can't look up in scopus using biblio")

        return url



    def _get_relevant_record_with_biblio(self, biblio_dict):
        try:        
            url = self._get_scopus_url(biblio_dict)

        except KeyError:
            logger.debug("tried _get_relevant_record_with_biblio but leaving because KeyError")
            return None

        if not url:
            return None

        page = self._get_scopus_page(url)

        if not page:
            return None  # empty result set

        relevant_records = self._extract_relevant_records(page, biblio_dict)
        return relevant_records


    def _get_metrics_and_drilldown_from_metrics_page(self, provider_url_template, namespace, id):
        relevant_records = None
        if namespace=="doi":
            relevant_records = self._get_relevant_record_with_doi(id)
        elif namespace=="biblio":
            relevant_records = self._get_relevant_record_with_biblio(id)

        if not relevant_records:
            # logger.info(u"no scopus page with id {id}".format(id=id))
            return {}

        metrics_and_drilldown = self._extract_metrics_and_provenance_url(relevant_records)
        
        return metrics_and_drilldown  


    def get_best_alias(self, aliases_dict):
        for namespace in ["doi", "biblio"]:
            if namespace in aliases_dict:
                return (namespace, aliases_dict[namespace][0])
        return (None, None)

    # custom, because uses doi if available, else biblio
    def metrics(self, 
            aliases,
            provider_url_template=None,
            cache_enabled=True):

        aliases_dict = provider.alias_dict_from_tuples(aliases)

        metrics_and_drilldown = {}
        if "doi" in aliases_dict:
            nid = aliases_dict["doi"][0]
            metrics_and_drilldown = self._get_metrics_and_drilldown_from_metrics_page(provider_url_template, 
                    namespace="doi", 
                    id=nid)

        if not metrics_and_drilldown and "biblio" in aliases_dict:
            nid = aliases_dict["biblio"][0]
            metrics_and_drilldown = self._get_metrics_and_drilldown_from_metrics_page(provider_url_template, 
                    namespace="biblio", 
                    id=nid)

        return metrics_and_drilldown

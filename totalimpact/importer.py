from unicode_helpers import remove_nonprinting_characters
from totalimpact.providers import crossref
from totalimpact.providers import arxiv
from totalimpact.providers import pubmed
from totalimpact.providers import webpage
import re
import logging

logger = logging.getLogger("ti.importer")

def is_doi(nid):
    nid = nid.lower()
    if nid.startswith("doi:") or nid.startswith("10.") or "doi.org/" in nid:
        return True
    return False

def is_pmid(nid):
    if nid.startswith("pmid") or (len(nid)>2 and len(nid)<=8 and re.search("\d+", nid)):
        return True
    return False

def is_url(nid):
    if nid.lower().startswith("http://") or nid.lower().startswith("https://"):
        return True
    return False

def is_arxiv(nid):
    if nid.lower().startswith("arxiv:") or "arxiv.org/" in nid:
        return True
    return False


def get_aliases_from_product_id_strings(product_id_strings):
    aliases = []

    logger.debug(u"in get_aliases_from_product_id_strings with product_id_strings {product_id_strings}".format(
        product_id_strings=product_id_strings))

    for nid in product_id_strings:
        logger.debug(u"in get_aliases_from_product_id_strings nid 1 {nid}".format(
            nid=nid))

        nid = remove_nonprinting_characters(nid)

        logger.debug(u"in get_aliases_from_product_id_strings nid 2 {nid}".format(
            nid=nid))

        nid = nid.strip()  # also remove spaces

        logger.debug(u"in get_aliases_from_product_id_strings with cleaned nid {nid}".format(
            nid=nid))

        if is_doi(nid):
            aliases += crossref.Crossref().member_items(nid)
        elif is_pmid(nid):
            aliases += pubmed.Pubmed().member_items(nid)
        elif is_arxiv(nid):
            aliases += arxiv.Arxiv().member_items(nid)
        elif is_url(nid):
            aliases += webpage.Webpage().member_items(nid)

        logger.debug(u"in get_aliases_from_product_id_strings with cleaned aliases {aliases}".format(
            aliases=aliases))

    return aliases


def import_products(provider_name, import_input):
    if provider_name in ["bibtex", "product_id_strings"]:
        logger.debug(u"in import_products with provider_name {provider_name}".format(
            provider_name=provider_name))
    else:
        logger.debug(u"in import_products with provider_name {provider_name}: {import_input}".format(
            provider_name=provider_name, import_input=import_input))


    logger.debug(u"extra: in import_products with provider_name {provider_name}: {import_input}".format(
        provider_name=provider_name, import_input=import_input))

    aliases = []

    # pull in standard items, if we were passed any of these
    if provider_name=="product_id_strings":
        logger.debug(u"in import_products, going to call get_aliases_from_product_id_strings")
        aliases = get_aliases_from_product_id_strings(import_input)
    elif provider_name=="bibtex":
        provider = ProviderFactory.get_provider("bibtex")
        aliases = provider.member_items(import_input)
    else:
        try:
            provider = ProviderFactory.get_provider(provider_name)
            aliases = provider.member_items(import_input)
        except ImportError:
            logger.debug(u"in import_products, got ImportError")
            pass

    logger.debug(u"returning from import_products with aliases {aliases}".format(
        aliases=aliases))

    return(aliases)

import os
import re
import requests
import logging
from urlparse import urljoin
from bs4 import BeautifulSoup
from embedly import Embedly

logger = logging.getLogger("tiwebapp.embed_markup")

def wrap_as_div(class_name, div_contents):
    return u"<div class='{class_name}'>{div_contents}</div>".format(
        class_name=class_name, div_contents=div_contents.decode("utf8"))

def wrap_as_image(class_name, image_url):
    return u"<img src='{image_url}' class='{class_name}' style='width: 550px;' />".format(
        class_name=class_name, image_url=image_url)

def wrap_in_pdf_reader(class_name, url):
    return u"""<iframe class="{class_name}" src="https://docs.google.com/viewer?url={url}&embedded=true" 
                width="600" height="780" style="border: none;"></iframe>""".format(
        class_name=class_name, url=url)

    # return u"""<iframe class="viewer {class_name}" id="viewerBox" 
    #             allowfullscreen="true" height="780" width="600" frameborder="0" 
    #             src="http://connect.ajaxdocumentviewer.com/?key=P4082014082914&viewertype=html5&document={url}&viewerheight=780&viewerwidth=600&printButton=Yes&toolbarColor=CCCCCC"
    #             allowtransparency="true"></iframe>""".format(
    #                 class_name=class_name, url=url)                

def wrap_with_embedly(url):
    logger.debug(u"calling embedly for {url}".format(
        url=url))

    client = Embedly(os.getenv("EMBEDLY_API_KEY"))
    # if not client.is_supported(url):
    #     return None

    response_dict = client.oembed(url, maxwidth=580, width=580)
    try:
        html = response_dict["html"]
        html = html.replace("http://docs.google", "https://docs.google")
        return html
    except (KeyError, AttributeError):
        return None


def get_github_embed_html(github_url):
    try:
        r = requests.get(github_url, timeout=20)
    except requests.exceptions.Timeout:
        return None
    soup = BeautifulSoup(r.text)
    match = soup.find(id="readme")
    if match:
        return wrap_as_div(u"embed-github", repr(match))
    return None

def get_dryad_embed_html(dryad_url):
    try:
        r = requests.get(dryad_url, timeout=20)
    except requests.exceptions.Timeout:
        return None        
    soup = BeautifulSoup(r.text)
    html = "".join([repr(tag) for tag in soup.find_all(attrs={'class': "package-file-description"})])  #because class is reserved
    if html:
        html = html.replace('href="/', 'href="http://datadryad.org/')
        return wrap_as_div(u"embed-dryad", html)
    return None

def get_figshare_embed_html(figshare_doi_url):
    logger.debug(u"calling get_figshare_embed_html for {figshare_doi_url}".format(
        figshare_doi_url=figshare_doi_url))

    try:
        r = requests.get(figshare_doi_url, timeout=20)
    except requests.exceptions.Timeout:
        logger.debug(u"timeout in get_figshare_embed_html for {figshare_doi_url}".format(
            figshare_doi_url=figshare_doi_url))
        return None

    soup = BeautifulSoup(r.text)

    # logger.debug("soup!  {soup}".format(
    #     soup=r.text))

    # case insensitive on download because figshare does both upper and lower
    figshare_resource_links = soup.find_all("a", text=re.compile(".ownload", re.IGNORECASE))
    logger.debug(u"figshare_resource_links before filter in get_figshare_embed_html {figshare_doi_url}".format(
        figshare_doi_url=figshare_doi_url))
    figshare_resource_links = [link for link in figshare_resource_links if link]  #remove blanks
    if not figshare_resource_links:
        logger.debug(u"no figshare_resource_links in get_figshare_embed_html for {figshare_doi_url}".format(
            figshare_doi_url=figshare_doi_url))
        return None
    url = None

    for match in figshare_resource_links:
        url = match.get("href")
        file_extension = url.rsplit(".")[-1]

        if file_extension in ["png", "gif", "jpg"]:
            return wrap_as_image("embed-picture", url)
        if file_extension in ["pdf"]:
            logger.debug(u"got a pdf in get_figshare_embed_html for {figshare_doi_url}".format(
                figshare_doi_url=figshare_doi_url))

            return wrap_in_pdf_reader("embed-pdf", url)

    logger.debug(u"no pdf in get_figshare_embed_html for {figshare_doi_url}".format(
        figshare_doi_url=figshare_doi_url))

    # if got here, just use the first matching url and give it a shot with embedly
    return wrap_with_embedly(figshare_resource_links[0].get("href"))


def extract_pdf_link_from_html(url):
    logger.debug(u"calling extract_pdf_link_from_html for {url}".format(
        url=url))

    try:
        r = requests.get(url, timeout=20)
    except requests.exceptions.Timeout:
        return None

    soup = BeautifulSoup(r.text)
    try:
        href = soup.find("a", text=re.compile(".*(\s*)pdf(\s*).*", re.IGNORECASE)).get("href")
    except AttributeError:
        href = None

    # handle relative urls
    if href and href.startswith("/"):
        href = urljoin(r.url, href)  # see https://docs.python.org/2/library/urlparse.html#urlparse.urljoin

    return href






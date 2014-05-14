"""
Functions
"""


def orders_of_magnitude(start_with_fives=False):
    ret = [1]
    if start_with_fives:
        ret += range(5, 50, 5) + range(50, 100, 10)  # fives then tens
    else:
        ret += range(10, 100, 10)  # tens

    ret += range(100, 1000, 100)  # hundreds
    ret += range(1000, 10000, 1000)  # thousands
    ret += range (10000, 100000, 10000)  # ten-thousands
    ret += range(100000, 500000, 100000)  # hundred-thousands
    return ret



"""
Award Configs
"""

award_configs = {
    "viewed":["views", 1],
    "discussed": ["discussion", 2],
    "saved": ["saves", 3],
    "cited": ["citation", 4],
    "recommended": ["recommendation", 5],
    "unknown": ["interactions", 6]
}




"""
Genre icons
"""
genre_icons = {
    'article': "icon-file-text-alt",
    'blog': "icon-comments",
    'dataset': "icon-table",
    'figure': "icon-bar-chart",
    'poster': "icon-picture",
    'slides': "icon-desktop",
    'software': "icon-save",
    'twitter': "icon-twitter",
    'video': "icon-facetime-video",
    'webpage': "icon-globe",
    'other': "icon-question-sign",
    'unknown': "icon-question-sign"
}




"""
Metric Configs
"""

config_keys = [
    "name",
    "audience",
    "engagement_type",
    "display",
    "min_for_award",
    "thresholds"
]

configs = [
    ["altmetric_com:tweets", "public", "discussed", "badge", 3, orders_of_magnitude(True)],
    ["altmetric_com:facebook_posts", "public", "discussed", "badge", orders_of_magnitude(True)],
    ["altmetric_com:gplus_posts", "public", "discussed", "badge",  orders_of_magnitude(True)],
    ["altmetric_com:blog_posts", "public", "discussed", "badge",  orders_of_magnitude(True)],
    ["citeulike:bookmarks", "scholars", "saved", "badge", orders_of_magnitude(True)],
    ["crossref:citations", "scholars", "cited", "badge", orders_of_magnitude(True)],
    ["delicious:bookmarks", "public", "saved", "badge", orders_of_magnitude(True)],
    ["dryad:most_downloaded_file"],
    ["dryad:package_views", "scholars", "viewed", "badge", orders_of_magnitude()],
    ["dryad:total_downloads", "scholars", "viewed", "badge", orders_of_magnitude()],
    ["figshare:views", "scholars", "viewed", "badge", orders_of_magnitude()],
    ["figshare:downloads", "scholars", "viewed", "badge", orders_of_magnitude()],
    ["figshare:shares", "scholars", "discussed", "badge", orders_of_magnitude(True)],
    ["github:forks", "public", "cited", "badge", orders_of_magnitude(True)],
    ["github:stars", "public", "recommended", "badge", orders_of_magnitude(True)],
    ["github:watchers", "public", "saved", "badge", 3],  # depricate this later
    ["mendeley:career_stage"],
    ["mendeley:country"],
    ["mendeley:discipline"],
    ["mendeley:student_readers"], # display later
    ["mendeley:developing_countries"], # display later
    ["mendeley:groups", "scholars", "saved", "badge", orders_of_magnitude()],
    ["mendeley:readers", "scholars", "saved", "badge", orders_of_magnitude(True)],
    ["pmc:pdf_downloads"],
    ["pmc:abstract_views"],
    ["pmc:fulltext_views"],
    ["pmc:unique_ip_views"],
    ["pmc:figure_views"],
    ["pmc:suppdata_views"],
    ["plosalm:crossref" ],                    # figure it out
    ["plosalm:html_views", "public", "viewed", "badge", orders_of_magnitude(True)],
    ["plosalm:pdf_views", "scholars", "viewed", "badge", orders_of_magnitude(True)],
    ["plosalm:pmc_abstract"],
    ["plosalm:pmc_figure"],
    ["plosalm:pmc_full-text"],
    ["plosalm:pmc_pdf"],
    ["plosalm:pmc_supp-data"],
    ["plosalm:pmc_unique-ip"],
    ["plosalm:pubmed_central"],
    ["plosalm:scopus"],                      # figure it out
    ["plossearch:mentions", "scholars", "cited", "badge", orders_of_magnitude(True)],
    ["pubmed:f1000", "scholars", "recommended", "badge", orders_of_magnitude(True)],
    ["pubmed:pmc_citations", "scholars", "cited", "badge", orders_of_magnitude()],
    ["pubmed:pmc_citations_editorials"],
    ["pubmed:pmc_citations_reviews"],
    ["scienceseeker:blog_posts"],
    ["scopus:citations", "scholars", "cited", "badge", orders_of_magnitude()],
    ["slideshare:comments", "public", "discussed", "badge", orders_of_magnitude()],
    ["slideshare:downloads", "public", "viewed", "badge", orders_of_magnitude()],
    ["slideshare:favorites", "public", "recommended", "badge", orders_of_magnitude()],
    ["slideshare:views", "public", "viewed", "badge", orders_of_magnitude()],
    ["vimeo:plays", "public", "viewed", "badge", orders_of_magnitude(True)],
    ["vimeo:likes", "public", "recommended", "badge", orders_of_magnitude(True)],
    ["vimeo:comments", "public", "discussed", "badge", orders_of_magnitude(True)],
    ["wikipedia:mentions", "public", "cited", "badge", orders_of_magnitude(True)],
    ["youtube:likes", "public", "recommended", "badge", orders_of_magnitude(True)],
    ["youtube:dislikes", "public", "discussed", "badge", orders_of_magnitude(True)],
    ["youtube:favorites", "public", "saved", "badge", orders_of_magnitude(True)],
    ["youtube:comments", "public", "discussed", "badge", orders_of_magnitude(True)],
    ["youtube:views", "public", "viewed", "badge", orders_of_magnitude(True)]
]


def get():
    ret = {}
    for config_values in configs:
        config_dict = dict(map(None, config_keys, config_values))
        metric_name = config_values[0]

        ret[metric_name] = config_dict

    return ret


def get_metric_config_by_key(key, return_nones=False):
    ret = {}
    for metric_name, config_dict in get().iteritems():
        if return_nones or config_dict[key] is not None:
            ret[metric_name] = config_dict[key]

    return ret




















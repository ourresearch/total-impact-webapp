
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

def remove_values_if_string_in_key(blacklist_strings, dict):
    keys_to_delete = []
    for key in dict.keys():
        for bad_str in blacklist_strings:
            if bad_str in key:
                keys_to_delete.append(key)

    ret = {}
    for k, v in dict.iteritems():
        if k not in keys_to_delete:
            ret[k] = v

    return ret


shared_values = {
    "altmetric_com:blog_posts": orders_of_magnitude(True),
    "altmetric_com:facebook_posts": orders_of_magnitude(True),
    "altmetric_com:gplus_posts": orders_of_magnitude(True),
    "altmetric_com:tweets": orders_of_magnitude(True),
    "citeulike:bookmarks": orders_of_magnitude(True),
    "delicious:bookmarks": orders_of_magnitude(True),
    "dryad:package_views": orders_of_magnitude(),
    "dryad:total_downloads": orders_of_magnitude(),
    "figshare:downloads": orders_of_magnitude(),
    "figshare:shares": orders_of_magnitude(True),
    "figshare:views": orders_of_magnitude(),
    "github:forks": orders_of_magnitude(True),
    "github:stars": orders_of_magnitude(True),
    "mendeley:groups": orders_of_magnitude(True),
    "mendeley:readers": orders_of_magnitude(),
    "plossearch:mentions": orders_of_magnitude(True),
    "pubmed:f1000": orders_of_magnitude(True),
    "pubmed:pmc_citations": orders_of_magnitude(),
    "pubmed:pmc_citations_editorials": orders_of_magnitude(True),
    "pubmed:pmc_citations_reviews": orders_of_magnitude(True),
    "scopus:citations": orders_of_magnitude(),
    "slideshare:comments": orders_of_magnitude(),
    "slideshare:downloads": orders_of_magnitude(),
    "slideshare:favorites": orders_of_magnitude(),
    "slideshare:views": orders_of_magnitude(),
    "vimeo:comments": orders_of_magnitude(True),
    "vimeo:likes": orders_of_magnitude(True),
    "vimeo:plays": orders_of_magnitude(True),
    "wikipedia:mentions": orders_of_magnitude(True),
    "youtube:comments": orders_of_magnitude(True),
    "youtube:dislikes": orders_of_magnitude(True),
    "youtube:favorites": orders_of_magnitude(True),
    "youtube:likes": orders_of_magnitude(True),
    "youtube:views": orders_of_magnitude(True)
}


values = {
    "product": shared_values,
    "profile": remove_values_if_string_in_key(
        ["scopus", "pubmed"],
        shared_values
    )
}




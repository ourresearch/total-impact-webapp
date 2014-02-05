from __future__ import division
import math
import time

def make_awards_list(user):

    awards_list = []

    award = OAAward()
    # eventually the first param here is user.about...
    # but right now that doesn't exist.
    award.calculate({}, user.products)

    awards_list.append(award)
    return awards_list





class ProfileAward(object):
    def __init__(self):
        self.level = 0
        self.name = "generic award"
        self.level_justification = "we said so"
        self.needed_for_next_level = None
        self.timestamp = int(time.time())
        self.extra = {}

    def as_dict(self):
        return {
            "name": self.name,
            "level": self.level,
            "level_name": self.level_name(self.level),
            "level_justification": self.level_justification,
            "needed_for_next_level": self.needed_for_next_level,
            "timestamp": self.timestamp,
            "extra": self.extra
        }

    def calculate(self, about, products):
        raise NotImplementedError  # override in children

    def level_name(self, level):
        return ["Gold", "Silver", "Bronze", "Basic", "None"][level-1]








class OAAward(ProfileAward):
    bins = [
        .80,  # ~10% users
        .50,  # 15%
        .30,  # 25%
        .10   # 50%
    ]

    def __init__(self):
        ProfileAward.__init__(self)
        self.name = "Open access"


    def calculate(self, about, products):
        article_products = [p for p in products if p["biblio"]["genre"] == "article"]
        article_count = len(article_products)
        self.extra["articles_count"] = article_count

        oa_articles = [p for p in article_products if "free_fulltext_url" in p["biblio"]]
        oa_article_count = len(oa_articles)
        self.extra["oa_articles_count"] = oa_article_count

        try:
            oa_proportion = oa_article_count / article_count
        except ZeroDivisionError:
            oa_proportion = 0

        self.extra["oa_articles_proportion"] = oa_proportion
        
        # calculate level
        bottom_level = len(self.bins) + 1
        level = bottom_level
        for i, bin_edge_val in enumerate(self.bins):
            if oa_proportion > bin_edge_val:
                level = i + 1  # levels start with 1
                break

        self.level = level


        # justification
        self.level_justification = "{num_oa} of this profile's {article_count} articles have free fulltext available.".format(
            num_oa=oa_article_count,
            article_count=article_count
        )


        # needed for next level
        try:
            next_level_cutoff = self.bins[level]
            oa_articles_in_next_level = int(math.ceil(next_level_cutoff * article_count))
            fulltext_urls_needed = oa_articles_in_next_level - oa_article_count

            self.needed_for_next_level = "add {needed} more Free Fulltext " \
                                         "links to your articles. Click " \
                                         "any article without the unlocked " \
                                         "icon to get started!".format(needed=fulltext_urls_needed)

        except IndexError:
            self.needed_for_next_level = None

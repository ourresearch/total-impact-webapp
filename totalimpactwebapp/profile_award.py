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
        self.level_justification = "we said so"
        self.needed_for_next_level = None
        self.timestamp = int(time.time())

    def as_dict(self):
        return {
            "level": self.level,
            "level_justification": self.level_justification,
            "needed_for_next_level": self.needed_for_next_level,
            "timestamp": self.timestamp
        }

    def calculate(self, about, products):
        raise NotImplementedError  # override in children








class OAAward(ProfileAward):
    bins = [.40, .60, .80]

    def calculate(self, about, products):
        article_products = [p for p in products if p["biblio"]["genre"] == "article"]

        print "article products!"
        print article_products

        oa_articles = [p for p in article_products if "free_fulltext_url" in p["biblio"]]
        
        oa_proportion = len(oa_articles) / len(article_products)
        best_level = len(self.bins)

        # calculate level
        level =  best_level
        for i, bin_edge_val in enumerate(self.bins):
            if oa_proportion < bin_edge_val:
                level = i
                break

        self.level = level


        # justification
        self.level_justification = "{num_oa} of your {num_products} have free fulltext available.".format(
            num_oa=len(oa_articles),
            num_products=len(products)
        )


        # needed for next level
        if self.level == best_level:
            self.needed_for_next_level = None
        else:
            next_level_cutoff = self.bins[level+1]
            oa_articles_in_next_level = math.ceil(next_level_cutoff * len(products))
            fulltext_urls_needed = oa_articles_in_next_level - len(oa_articles)

            self.needed_for_next_level = "add {needed} more Free Fulltext " \
                                         "links to your articles. Click " \
                                         "any article without the unlocked " \
                                         "icon to get started!".format(needed=fulltext_urls_needed)

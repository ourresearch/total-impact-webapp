

def grant_awards(user):

    award = ProfileAward()
    award.calculate(user.about, user.products)

    user.awards.append(award)





class ProfileAward(object):
    def __init__(self):
        self.level = 0
        self.level_justification = "we said so"
        self.needed_for_next_level = "to buy seven more magic beans"

    def as_dict(self):
        pass

    def calculate(self, about, calculate):
        raise NotImplementedError  # override in children








class OAAward(ProfileAward):
    bins = [40, 60, 80]

    def calculate(self, about, products):
        oa_products = [p for p in products if "free_fulltext_url" in p.biblio]
        oa_percentage = len(oa_products) / len(products)

        # calculate level
        level = len(self.bins)  # assume best value to start
        for i, bin_edge_val in enumerate(self.bins):
            if oa_percentage < bin_edge_val:
                level = i
                break

        self.level = level

import logging
from totalimpactwebapp.util import cached_property
from totalimpactwebapp.util import dict_from_dir
from totalimpactwebapp import configs

logger = logging.getLogger("ti.account")


def account_factory(product):
    account = None
    if product.is_account_product:
        if product.host == "twitter":
            account = TwitterAccount(product)
        elif product.host == "github":
            account = GitHubAccount(product)
        elif product.host == "slideshare":
            account = SlideShareAccount(product)

    return account



class Account(object):
    def __init__(self, product):
        self.product = product

    @cached_property
    def display_name(self):
        return self.__class__.__name__.replace("Account", "")

    @cached_property
    def index_name(self):
        return self.display_name.lower().replace(" ", "_")

    @cached_property
    def tiid(self):
        return self.product.tiid

    @cached_property
    def provider_name(self):
        provider_name = self.display_name.lower()
        if provider_name != "twitter":
            provider_name += "_account"
        return provider_name

    @cached_property
    def followers(self):
        follower_metric = self.product.get_metric_by_name(self.provider_name, "followers")
        if follower_metric:
            return follower_metric.current_value
        else:
            return 0

    @cached_property
    def username(self):
        username = self.product.biblio.account
        if "/" in self.product.biblio.account:
            username = username.split("/")[-1]
        return username
        
    @cached_property
    def account_url(self):
        return configs.linked_accounts[self.index_name].format(
            id=self.username)

    def to_dict(self):
        attributes_to_ignore = [
            "product"
        ]
        ret = dict_from_dir(self, attributes_to_ignore)
        return ret



class TwitterAccount(Account):
    pass

class GitHubAccount(Account):
    pass

class SlideShareAccount(Account):
    pass

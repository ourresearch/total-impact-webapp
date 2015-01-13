from functools import wraps
from flask import request, current_app
import random, math
import re
import jinja2
from time import sleep
import datetime
import stripe
import emailer
from unicode_helpers import to_unicode_or_bust
import unicodedata

from sqlalchemy.exc import IntegrityError, DataError, InvalidRequestError
from sqlalchemy.orm.exc import FlushError


import logging
logger = logging.getLogger('ti.util')

# a slow decorator for tests, so can exclude them when necessary
# put @slow on its own line above a slow test method
# to exclude slow tests, run like this: nosetests -A "not slow"
def slow(f):
    f.slow = True
    return f


def remove_punctuation(input_string):
    # from http://stackoverflow.com/questions/265960/best-way-to-strip-punctuation-from-a-string-in-python
    no_punc = input_string
    if input_string:
        no_punc = "".join(e for e in input_string if (e.isalnum() or e.isspace()))
    return no_punc


# see http://www.fileformat.info/info/unicode/category/index.htm
def remove_unneeded_characters(input_string, encoding='utf-8', char_classes_to_remove=["C", "M", "P", "S", "Z"]):
    input_was_unicode = True
    if isinstance(input_string, basestring):
        if not isinstance(input_string, unicode):
            input_was_unicode = False

    unicode_input = to_unicode_or_bust(input_string)

    response = u''.join(c for c in unicode_input if unicodedata.category(c)[0] not in char_classes_to_remove)

    if not input_was_unicode:
        response = response.encode(encoding)
        
    return response



# derived from the jsonp function in bibserver
def jsonp(f):
    """Wraps JSONified output for JSONP"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        callback = request.args.get('callback', False)
        if callback:
            content = str(callback) + '(' + str(f(*args,**kwargs).data) + ')'
            return current_app.response_class(content, mimetype='application/javascript')
        else:
            return f(*args, **kwargs)
    return decorated_function



def jinja_render(template_name, context):
    templateLoader = jinja2.FileSystemLoader(searchpath="totalimpactwebapp/templates")
    templateEnv = jinja2.Environment(loader=templateLoader)
    html_template = templateEnv.get_template(template_name)
    return html_template.render(context)



def pickWosItems(num_total_results, num_subset_results):
    num_in_final_sample = 100
    num_results_per_page = 50
    num_to_sample = int(math.ceil(
        float(num_subset_results * num_in_final_sample) / float(num_total_results)
    ))

    # "id" is the index of the result in the result subset
    subset_result_ids = range(1, num_subset_results)
    ids_to_sample = sorted(random.sample(subset_result_ids, num_to_sample))

    pages_and_ids = []
    for result_id in ids_to_sample:
        page = int(math.floor(result_id / num_results_per_page)) +1
        pages_and_ids.append((page, result_id))

    return pages_and_ids



_underscorer1 = re.compile(r'(.)([A-Z][a-z]+)')
_underscorer2 = re.compile('([a-z0-9])([A-Z])')

def camel_to_snake_case(s):
    """
    from http://stackoverflow.com/questions/1175208/elegant-python-function-to-convert-camelcase-to-camel-case
    and https://gist.github.com/jaytaylor/3660565
    """
    subbed = _underscorer1.sub(r'\1_\2', s)
    return _underscorer2.sub(r'\1_\2', subbed).lower()


def local_sleep(interval, fuzz_proportion=.2):
    """
    Add some sleep to simulate running on a server.
    """
    if fuzz_proportion:
        max_fuzz_distance = interval * fuzz_proportion
        interval += random.uniform(-max_fuzz_distance, max_fuzz_distance)

    if "localhost:5000" in request.url_root:
        logger.debug(u"sleeping on local for {second} seconds".format(
            second=interval))
        sleep(interval)


def as_int_or_float_if_possible(input_value):
    value = input_value
    try:
        value = int(input_value)
    except (ValueError, TypeError):
        try:
            value = float(input_value)
        except (ValueError, TypeError):
            pass
    return(value)


def dict_from_dir(obj, keys_to_ignore=None, keys_to_show="all"):

    if keys_to_ignore is None:
        keys_to_ignore = []
    elif isinstance(keys_to_ignore, basestring):
        keys_to_ignore = [keys_to_ignore]

    ret = {}

    if keys_to_show != "all":
        for key in keys_to_show:
            ret[key] = getattr(obj, key)

        return ret


    for k in dir(obj):
        pass

        if k.startswith("_"):
            pass
        elif k in keys_to_ignore:
            pass

        # hide sqlalchemy stuff
        elif k in ["query", "query_class", "metadata"]:
            pass
        else:
            value = getattr(obj, k)
            if not callable(value):
                ret[k] = value

    return ret


def todict(obj, classkey=None):
    # from http://stackoverflow.com/a/1118038/226013
    if isinstance(obj, dict):
        data = {}
        for (k, v) in obj.items():
            data[k] = todict(v, classkey)
        return data

    elif hasattr(obj, "to_dict"):
        data = dict([
            (key, todict(value, classkey))
            for key, value in obj.to_dict().iteritems()
            if key == "_tiid" or (not callable(value) and not key.startswith('_'))
        ])

        if classkey is not None and hasattr(obj, "__class__"):
            data[classkey] = obj.__class__.__name__
        return data

    elif hasattr(obj, "_ast"):
        return todict(obj._ast())
    elif type(obj) is datetime.datetime:  # convert datetimes to strings; jason added this bit
        return obj.isoformat()
    elif hasattr(obj, "__iter__"):
        return [todict(v, classkey) for v in obj]

    elif hasattr(obj, "__dict__"):
        data = dict([(key, todict(value, classkey))
            for key, value in obj.__dict__.iteritems()
            if not callable(value) and not key.startswith('_')])
        if classkey is not None and hasattr(obj, "__class__"):
            data[classkey] = obj.__class__.__name__
        return data
    else:
        return obj


    
# getting a "decoding Unicode is not supported" error in this function?  
# might need to reinstall libaries as per 
# http://stackoverflow.com/questions/17092849/flask-login-typeerror-decoding-unicode-is-not-supported
class HTTPMethodOverrideMiddleware(object):
    allowed_methods = frozenset([
        'GET',
        'HEAD',
        'POST',
        'DELETE',
        'PUT',
        'PATCH',
        'OPTIONS'
    ])
    bodyless_methods = frozenset(['GET', 'HEAD', 'OPTIONS', 'DELETE'])

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        method = environ.get('HTTP_X_HTTP_METHOD_OVERRIDE', '').upper()
        if method in self.allowed_methods:
            method = method.encode('ascii', 'replace')
            environ['REQUEST_METHOD'] = method
        if method in self.bodyless_methods:
            environ['CONTENT_LENGTH'] = '0'
        return self.app(environ, start_response)




class Timer(object):
    def __init__(self):
        self.start = datetime.datetime.now()
        self.last_check = self.start

    def since_last_check(self):
        return self.elapsed(since_last_check=True)

    def elapsed(self, since_last_check=False):
        if since_last_check:
            window_start = self.last_check
        else:
            window_start = self.start

        current_datetime = datetime.datetime.now()
        self.last_check = current_datetime

        elapsed_seconds = (current_datetime - window_start).total_seconds()
        return elapsed_seconds


def ordinal(value):
    """
    Converts zero or a *postive* integer (or their string
    representations) to an ordinal value.

    >>> for i in range(1,13):
    ...     ordinal(i)
    ...
    u'1st'
    u'2nd'
    u'3rd'
    u'4th'
    u'5th'
    u'6th'
    u'7th'
    u'8th'
    u'9th'
    u'10th'
    u'11th'
    u'12th'

    >>> for i in (100, '111', '112',1011):
    ...     ordinal(i)
    ...
    u'100th'
    u'111th'
    u'112th'
    u'1011th'

    """
    try:
        value = int(value)
    except ValueError:
        return value
    except TypeError:
        return value

    if value % 100//10 != 1:
        if value % 10 == 1:
            ordval = u"%d%s" % (value, "st")
        elif value % 10 == 2:
            ordval = u"%d%s" % (value, "nd")
        elif value % 10 == 3:
            ordval = u"%d%s" % (value, "rd")
        else:
            ordval = u"%d%s" % (value, "th")
    else:
        ordval = u"%d%s" % (value, "th")

    return ordval


# from http://code.activestate.com/recipes/576563-cached-property/
def cached_property(property_name):
    """A memoize decorator for class properties."""
    @wraps(property_name)
    def cached_propery_get(self):
        try:
            return self._cache[property_name]
        except AttributeError:
            self._cache = {}
        except KeyError:
            pass
        ret = self._cache[property_name] = property_name(self)
        return ret
    return property(cached_propery_get)


def commit(db):
    try:
        db.session.commit()
    except (IntegrityError, FlushError) as e:
        db.session.rollback()
        logger.warning(u"Error on commit, rolling back.  Message: {message}".format(
            message=e.message))    


def random_alpha_str(length=5):
    return ''.join(random.choice('ABCDEFGHJKLMNOPQRSTUVWXYZ') for i in range(length))


def mint_stripe_coupon(stripe_token, email, cost, num_subscriptions):

    coupon_code = "MS_" + random_alpha_str()
    print "making a stripe coupon with this code: ", coupon_code
    descr = "Coupon {coupon_code}: {num_subscriptions} Impactstory subscriptions for ${cost}".format(
        coupon_code=coupon_code,
        num_subscriptions=num_subscriptions,
        cost=cost
    )

    # mint a coupon from stripe
    print "making a stripe coupon with this code: ", coupon_code
    coupon_resp = stripe.Coupon.create(
        id=coupon_code,
        percent_off=100,
        duration="repeating",
        duration_in_months=12,
        max_redemptions=num_subscriptions,
        metadata={"email": email}
    )

    # charge the card one time
    charge_resp = stripe.Charge.create(
        amount=cost*100,
        currency="USD",
        card=stripe_token,
        description=descr,
        statement_description="Impactstory",
        receipt_email=email,
        metadata={
            "coupon": coupon_code
        }
    )

    # email them their coupon code
    emailer.send(
        address=email,
        subject="Your code for Impactstory subscriptions",
        template_name="multi-subscribe",
        context={
            "num_subscriptions": num_subscriptions,
            "coupon_code": coupon_code
        }
    )








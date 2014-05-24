from functools import wraps
from flask import request, current_app
import random, math
import re
import jinja2
from time import sleep
import datetime


# a slow decorator for tests, so can exclude them when necessary
# put @slow on its own line above a slow test method
# to exclude slow tests, run like this: nosetests -A "not slow"
def slow(f):
    f.slow = True
    return f

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



def todict(obj, classkey=None):
    # from http://stackoverflow.com/a/1118038/226013
    if isinstance(obj, dict):
        data = {}
        for (k, v) in obj.items():
            data[k] = todict(v, classkey)
        return data
    elif hasattr(obj, "as_dict"):
        print "trying as_dict."
        return todict(obj.as_dict, classkey)
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



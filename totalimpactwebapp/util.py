from functools import wraps
from flask import request, current_app
import random, math


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
        page = int(math.floor(result_id / num_results_per_page))
        pages_and_ids.append((page, result_id))

    return pages_and_ids


from time import time
import argparse
import logging
from time import time

from totalimpactwebapp import db
from totalimpactwebapp import ti_queues


def empty_queue(queue_number_str):
    queue_number = int(queue_number_str)
    num_jobs = ti_queues[queue_number].count
    ti_queues[queue_number].empty()

    print "emptied {} jobs on queue #{}....".format(
        num_jobs,
        queue_number)


def main(fn, optional_args=None):

    start = time()

    # call function by its name in this module, with all args :)
    # http://stackoverflow.com/a/4605/596939
    if optional_args:
        globals()[fn](*optional_args)
    else:
        globals()[fn]()




if __name__ == "__main__":



    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run stuff.")
    parser.add_argument('function', type=str, help="what function you want to run")
    parser.add_argument('optional_args', nargs='*', help="positional args for the function")

    args = vars(parser.parse_args())

    function = args["function"]
    optional_args = args["optional_args"]

    print u"running main.py {function} with these args:{optional_args}\n".format(
        function=function, optional_args=optional_args)

    global logger
    logger = logging.getLogger("ti.main.{function}".format(
        function=function))

    main(function, optional_args)

    db.session.remove()



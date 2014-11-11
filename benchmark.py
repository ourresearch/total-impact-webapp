import argparse
import requests
import datetime
import numpy

def benchmark_endpoint(endpoint, loc, tries):
    if not endpoint.startswith("/"):
        endpoint = "/" + endpoint

    if loc == "local":
        url = "http://localhost:5000" + endpoint
    elif loc == "production":
        url = "https://impactstory.org" + endpoint
    elif loc == "staging":
        url = "https://staging-impactstory.org" + endpoint

    elapsed_list = []
    for i in range(0, tries):
        start_time = datetime.datetime.now()
        res = requests.get(url)
        elapsed_datetime = datetime.datetime.now() - start_time
        elapsed_seconds = elapsed_datetime.total_seconds()

        elapsed_list.append(elapsed_seconds)
        padded_elapsed = str(round(elapsed_seconds, 2)).rjust(8)
        print "{secs} {bar}".format(
            secs=padded_elapsed,
            bar="=" * (int(round(elapsed_seconds * 5)))
        )

    print "MEAN: {mean_seconds} sec, MEDIAN: {median_seconds}".format(
        mean_seconds=round(numpy.mean(elapsed_list), 2),
        median_seconds=round(numpy.median(elapsed_list), 2)
    )



if __name__ == "__main__":

    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run stuff.")
    parser.add_argument('endpoint', type=str, help="the endpoint you want to test, like /jason/products")
    parser.add_argument('--loc', default="local", type=str, help="'local', 'production', or 'staging'")
    parser.add_argument('--tries', default=50, type=int, help="number of times to try the endpoint")

    args = vars(parser.parse_args())
    print args
    
    print u"running benchmark.py."
    benchmark_endpoint(args["endpoint"], args["loc"], args["tries"])



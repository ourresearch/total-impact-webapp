import heroku
import argparse
import logging
import os

logger = logging.getLogger("ti.heroku_api")

def run(app_name, process_name_start_to_restart, command):
    cloud = heroku.from_key(os.getenv("HEROKU_API_KEY"))
    app = cloud.apps[app_name]
    if command=="restart":
        print(u"restarting {app_name}, processes that start with {process_name}".format(
            app_name=app_name, process_name=process_name_start_to_restart))
        for process in app.processes:
            process_name = process.process
            process_name_start = process_name.split(".")[0]
            if process_name_start==process_name_start_to_restart:
                process.restart()
                print(u"upon request in heroku_api, restarted {process_name}".format(
                    process_name=process_name))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run stuff")
    parser.add_argument('--app', default=None, type=str, help="total-impact-webapp-staging")
    parser.add_argument('--process', default=None, type=str, help="process")
    parser.add_argument('--command', default=None, type=str, help="restart")
    args = vars(parser.parse_args())
    print args
    print u"heroku_api.py starting."
    run(args["app"], args["process"], args["command"])

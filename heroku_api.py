import heroku
import argparse
import logging
import os

logger = logging.getLogger("webapp.heroku_api")

def run(app, command):
    cloud = heroku.from_key(os.getenv("HEROKU_API_KEY"))
    app = cloud.apps[app]
    if command=="restart":
        print(u"restarting {app}".format(
            app=app))
        for process in app.processes:
            process.restart()
            print(u"upon request in heroku_api, restarted {process}".format(
                process=process))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run stuff")
    parser.add_argument('--app', default=None, type=str, help="total-impact-core-staging")
    parser.add_argument('--command', default=None, type=str, help="restart")
    args = vars(parser.parse_args())
    print args
    print u"heroku_api.py starting."
    run(args["app"], args["command"])

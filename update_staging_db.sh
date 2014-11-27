#!/usr/bin/env bash

# turn debugging on.  turn it off at the end of the script
set -x

# install heroku toolbelt
# inspired by https://toolbelt.heroku.com/install.sh
curl -s https://s3.amazonaws.com/assets.heroku.com/heroku-client/heroku-client.tgz | tar xz
mv heroku-client/* .
rmdir heroku-client
PATH="bin:$PATH"

# now transfer database from production to staging
# if fresh capture commented out, will use capture from within the last 24 hours
#heroku pgbackups:capture HEROKU_POSTGRESQL_MAROON_URL --expire --app total-impact-core
heroku pg:reset HEROKU_POSTGRESQL_YELLOW_URL  --app total-impact-core-staging --confirm total-impact-core-staging
heroku pgbackups:restore HEROKU_POSTGRESQL_YELLOW_URL `heroku pgbackups:url --app total-impact-core` --app total-impact-core-staging --confirm total-impact-core-staging

# turn debugging off
set +x

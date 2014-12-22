#!/usr/bin/env bash

# turn debugging on.  turn it off at the end of the script
set -x

# get this in logs
date

# make sure database url is set to this.  Script assumes db named "workingdb".
# export DATABASE_URL=postgres://localhost/workingdb
# echo "set DATABASE_URL to postgres://localhost/workingdb"

# show the newest snap on local, before update
# psql -d workingdb -c 'select max(last_collected_date) from snap;'

# copy local db from server into a file
curl -o fresh.db `heroku pgbackups:url --app total-impact-core`

# make a new local database with a temporary name
psql -c 'CREATE DATABASE freshdb;'

# restore the fresh database from the file
pg_restore --verbose --clean --no-acl --no-owner -h localhost -d freshdb fresh.db

# now kill all connections to the local postgres server so we can rename
# from http://stackoverflow.com/a/13023189/596939
cat <<-EOF | psql  
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
where pg_stat_activity.datname = 'workingdb'
EOF

# make the fresh database the active one, drop the old one
psql -c 'ALTER DATABASE workingdb RENAME to olddb;'
psql -c 'ALTER DATABASE freshdb RENAME to workingdb;'
psql -c 'DROP DATABASE olddb;'

# clean up temporary files
rm fresh.db

# show the newest snap on local, after update
psql -d workingdb -c 'select max(last_collected_date) from snap;'
echo "******** SUCCESS!  DONE!  :)  **************"

# get this in logs
date

# turn debugging off
set +x


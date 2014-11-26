from totalimpactwebapp import db

# from http://stackoverflow.com/questions/21469884/commiting-a-transaction-from-a-postgresql-function-in-flask
def run_sql(sql):
    connection = db.engine.connect()
    trans = connection.begin()
    retval = None
    try:
        retval = connection.execute(sql).fetchall()

        trans.commit()
    except:
        trans.rollback()
        raise
    return retval

if __name__ == "__main__":
    # update_partition function is defined in an sql file in this repo
    # make new tables for next month, if not already made
    # is safe to call daily
    sql = "SELECT update_partitions('2014-11-01','public','snap','tableownerdummy','last_collected_date','month')"
    result = run_sql(sql)
    print "new tables created:", result

    # see how many partition tables there are
    # wildcards need to be escaped as %%
    sql = "SELECT tablename FROM pg_catalog.pg_tables where tablename like 'snap%%' order by tablename"
    result = run_sql(sql)
    print "all snap tables:"
    for (tablename, ) in result:
        print " *", tablename

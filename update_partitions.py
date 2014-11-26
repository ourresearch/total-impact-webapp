from totalimpactwebapp import db

if __name__ == "__main__":
    # update_partition function is defined in an sql file in this repo
    # make new tables for next month, if not already made
    # is safe to call daily
    sql = "SELECT update_partitions('2014-11-01','public','snap','tableownerdummy','last_collected_date','month')"
    result = db.engine.execute(sql)
    db.session.commit()
    print "new tables created:", result.fetchall()

    # see how many partition tables there are
    # wildcards need to be escaped as %%
    sql = "SELECT tablename FROM pg_catalog.pg_tables where tablename like 'snap%%' order by tablename"
    result = db.engine.execute(sql)
    db.session.commit()
    print "all snap tables:"
    for (tablename, ) in result.fetchall():
        print " *", tablename

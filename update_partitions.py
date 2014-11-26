from totalimpactwebapp import db

if __name__ == "__main__":
    sql_to_update_partitions = "SELECT update_partitions('2014-11-01','public','snap','tableownerdummy','last_collected_date','month')"
    result = db.engine.execute(sql)
    result.fetchall()
    print result


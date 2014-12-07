# from http://www.calazan.com/a-simple-python-script-for-backing-up-a-postgresql-database-and-uploading-it-to-amazon-s3/
import os
import sys
import subprocess
from optparse import OptionParser
from datetime import date, datetime, timedelta

import boto
from boto.s3.key import Key


# Amazon S3 settings.
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
DB_APP_NAME = "total-impact-core" # should be in sync with AWS bucket name wrt staging/production

def get_database_cred_from_heroku_app():
    cmd_list = ['heroku', 'pg:credentials', 'DATABASE', '--app', DB_APP_NAME]
    ps = subprocess.Popen(cmd_list, stdout=subprocess.PIPE)
    output = ps.communicate()[0]
    cred_dict = dict([t.split("=") for t in output.splitlines()[1].replace('"',"").split(' ') if t])
    return cred_dict

def call_pg_dump(cred_dict, tablename, dumped_file):
    # -Fc is a compressed format
    cmd_list = ['PGPASSWORD='+cred_dict["password"],
                'pg_dump', 
                '-h', cred_dict["host"], 
                '-p', cred_dict["port"], 
                '-U', cred_dict["user"], 
                '-Fc', cred_dict["dbname"], 
                '-f', dumped_file, 
                '--verbose',
                '--data-only']
    if tablename:
        cmd_list += ['-t', tablename]
        print cmd_list
    ps = subprocess.Popen(" ".join(cmd_list), stdout=subprocess.PIPE, shell=True)
    output = ps.communicate()[0]
    print output
    return output


def upload_to_s3(dumped_file, aws_filename, bucket_name=None):
    """
    Upload a file to an AWS S3 bucket.
    """
    if not bucket_name:
        bucket_name = os.getenv("AWS_BUCKET", "impactstory-uploads-local")

    conn = boto.connect_s3(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
    bucket = conn.get_bucket(bucket_name)
    k = Key(bucket)
    k.key = aws_filename
    k.set_contents_from_filename(dumped_file)


def backup_table(cred_dict, tablename):
    dumped_file = tablename
    aws_filename='old-snaps/' + dumped_file + ".dump"

    output = call_pg_dump(cred_dict, tablename, dumped_file)

    upload_to_s3(dumped_file, aws_filename, bucket_name)

    try:
        print 'Uploading %s to Amazon S3...' % aws_filename
        upload_to_s3(dumped_file, aws_filename)
    except boto.exception.S3ResponseError:
        print 'Upload did not complete'



# from http://stackoverflow.com/questions/10688006/generate-a-list-of-datetimes-between-an-interval-in-python
def perdelta(start, end, delta):
    curr = start
    while curr < end:
        yield curr
        curr += delta

def main():
    parser = OptionParser()

    now = datetime.now()
    # four_months_ago = now + timedelta(days=-124)
    # two_months_ago = now + timedelta(days=-62)

    four_months_ago = now + timedelta(days=-4)
    two_months_ago = now + timedelta(days=-3)

    cred_dict = get_database_cred_from_heroku_app()

    for a_month in perdelta(four_months_ago, two_months_ago, timedelta(days=31)): 
        tablename = a_month.strftime("snap_%Y%m")
        print tablename
        backup_table(cred_dict, tablename)

if __name__ == '__main__':
    main()


# restore the tables again with this
# heroku pgbackups:restore DATABASE 'https://s3.amazonaws.com/bucket_name/properties.dump'


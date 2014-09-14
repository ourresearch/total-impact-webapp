from totalimpactwebapp.product import Product
from totalimpactwebapp.profile import Profile
from totalimpactwebapp.profile import refresh_products_from_tiids
from totalimpactwebapp.reference_set import save_all_reference_set_lists
from totalimpactwebapp.reference_set import RefsetBuilder
from totalimpactwebapp.product_deets import populate_product_deets
from totalimpactwebapp.util import commit
from totalimpactwebapp import db
import tasks

from sqlalchemy import and_, func
import datetime
import os
import requests
import argparse
import logging

logger = logging.getLogger("webapp.daily")



"""
requires these env vars be set in this environment:
DATABASE_URL
"""

try:
    # set jason's env variables for local running.
    import config
    config.set_env_vars_from_dot_env()
except ImportError:
    pass


def page_query(q):
    offset = 0
    while True:
        r = False
        for elem in q.limit(50).offset(offset):
           r = True
           yield elem
        offset += 50
        if not r:
            break

# from https://bitbucket.org/zzzeek/sqlalchemy/wiki/UsageRecipes/WindowedRangeQuery
# cited from many webpages as good way to do paging
def column_windows(session, column, windowsize):
    """Return a series of WHERE clauses against 
    a given column that break it into windows.

    Result is an iterable of tuples, consisting of
    ((start, end), whereclause), where (start, end) are the ids.

    Requires a database that supports window functions, 
    i.e. Postgresql, SQL Server, Oracle.

    Enhance this yourself !  Add a "where" argument
    so that windows of just a subset of rows can
    be computed.

    """
    def int_for_range(start_id, end_id):
        if end_id:
            return and_(
                column>=start_id,
                column<end_id
            )
        else:
            return column>=start_id

    q = session.query(
                column, 
                func.row_number().\
                        over(order_by=column).\
                        label('rownum')
                ).\
                from_self(column)
    if windowsize > 1:
        q = q.filter("rownum %% %d=1" % windowsize)

    intervals = [id for id, in q]

    while intervals:
        start = intervals.pop(0)
        if intervals:
            end = intervals[0]
        else:
            end = None
        yield int_for_range(start, end)



def windowed_query(q, column, windowsize):
    """"Break a Query into windows on a given column."""

    for whereclause in column_windows(
                                        q.session, 
                                        column, windowsize):
        for row in q.filter(whereclause).order_by(column):
            yield row





def add_product_deets_for_everyone(url_slug=None, skip_until_url_slug=None):
    if url_slug:
        profile_iterator = [Profile.query.filter_by(url_slug=url_slug).first()]
    else:
        q = db.session.query(Profile)
        profile_iterator = windowed_query(q, Profile.url_slug, 25)
        # profile_iterator = page_query(Profile.query.order_by(Profile.url_slug.asc()))

    run_id = datetime.datetime.utcnow().isoformat()
    for profile in profile_iterator:
        if skip_until_url_slug and skip_until_url_slug.lower() > profile.url_slug.lower():
            logger.info(u"in add_product_deets_for_everyone and skipping {url_slug}".format(
                url_slug=profile.url_slug))
            continue

        logger.info(u"add_product_deets_for_everyone: {url_slug}".format(
            url_slug=profile.url_slug))

        for product in profile.products_not_removed:
            # logger.info(u"add_product_deets_for_everyone: {url_slug}, tiid={tiid}".format(
            #     url_slug=profile.url_slug, tiid=product.tiid))
            product_deets = populate_product_deets(profile, product)  # not delayed
            product_deets.run_id = run_id
            db.session.add(product_deets)
        db.session.commit()


def deduplicate_everyone():
    q = db.session.query(Profile)
    for profile in windowed_query(q, Profile.url_slug, 25):
        logger.info(u"deduplicate_everyone: {url_slug}".format(url_slug=profile.url_slug))
        response = tasks.deduplicate.delay(profile.id)




def email_report_to_url_slug(url_slug=None):
    if url_slug:
        profile = Profile.query.filter(func.lower(Profile.url_slug) == func.lower(url_slug)).first()
        # print profile.url_slug
        tasks.send_email_report(profile)


def email_report_to_everyone_who_needs_one(max_emails=None):
    number_emails_sent = 0

    q = db.session.query(Profile)
    for profile in windowed_query(q, Profile.url_slug, 25):

        # logger.debug(u"in email_report_to_everyone_who_needs_one for {url_slug}".format(
        #     url_slug=profile.url_slug))

        try:
            if not profile.email or (u"@" not in profile.email):
                logger.info(u"not sending, no email address for {url_slug}".format(url_slug=profile.url_slug))
            elif profile.notification_email_frequency == "none":
                logger.info(u"not sending, {url_slug} is unsubscribed".format(url_slug=profile.url_slug))
            elif profile.last_email_sent and ((datetime.datetime.utcnow() - profile.last_email_sent).days < 7):
                logger.info(u"not sending, {url_slug} already got email this week".format(url_slug=profile.url_slug))
            else:
                logger.info(u"checking email for {url_slug}".format(url_slug=profile.url_slug))
                # status = tasks.send_email_if_new_diffs.delay(profile.id)
                status = tasks.send_email_if_new_diffs(profile)
                if status=="email sent":
                    number_emails_sent += 1    
                    if max_emails:
                        logger.info(u"sent an email, have {num} left before hitting max".format(
                        num = max_emails-number_emails_sent))
                logger.info(u"checked email for {url_slug}, status={status}".format(
                    url_slug=profile.url_slug, status=status))

        except Exception as e:
            logger.warning(u"EXCEPTION in email_report_to_everyone_who_needs_one for {url_slug}, skipping to next profile.  Error {e}".format(
                url_slug=profile.url_slug, e=e))
            pass

        if max_emails and number_emails_sent >= max_emails:
            logger.info(u"Reached max_number_profiles_to_consider, so no done queueing email")
            break

    return




def build_refsets(save_after_every_profile=False):
    refset_builder = RefsetBuilder()

    q = db.session.query(Profile)
    for profile in windowed_query(q, Profile.url_slug, 25):
        refset_builder.process_profile(profile)
        if save_after_every_profile:
            save_all_reference_set_lists(refset_builder)

    save_all_reference_set_lists(refset_builder)



def collect_embed(min_tiid=None):
    if min_tiid:
        q = db.session.query(Product).filter(Product.profile_id != None).filter(Product.tiid>min_tiid)
    else:
        q = db.session.query(Product).filter(Product.profile_id != None)

    start_time = datetime.datetime.utcnow()
    number_considered = 0.0
    number_markups = 0.0
    for product in windowed_query(q, Product.tiid, 25):
        number_considered += 1

        if product.genre=="unknown" or product.removed:
            continue

        try:
            embed_markup = product.get_embed_markup()
        except Exception:
            print "got an exception, skipping", product.aliases.best_url
            continue

        if embed_markup:
            print number_considered, number_markups, product.tiid, product.host, product.aliases.best_url
            # print "  got an embed for", product.genre, "!"
            product.embed_markup = embed_markup
            db.session.add(product)
            commit(db)
            number_markups += 1
            elapsed_seconds = (datetime.datetime.utcnow() - start_time).seconds
            print "elapsed seconds=", elapsed_seconds, ";  number per second=", number_considered/(0.1+elapsed_seconds)


def linked_accounts(account_type, url_slug=None):
    column_name = account_type+"_id"
    if url_slug:
        q = db.session.query(Profile).filter(getattr(Profile, column_name) != None).filter(Profile.url_slug==url_slug)
    else:
        q = db.session.query(Profile).filter(getattr(Profile, column_name) != None)

    start_time = datetime.datetime.utcnow()
    number_considered = 0.0
    number_markups = 0.0
    for profile in windowed_query(q, Profile.url_slug, 25):
        number_considered += 1
        try:
            print profile.url_slug, "previous number of account products:", len(profile.account_products)
            print profile.account_products
        except UnicodeEncodeError:
            pass
        tiids = profile.update_products_from_linked_account(account_type, update_even_removed_products=False)
        if tiids:
            print "  ", profile.url_slug, account_type, "got a tiid!"


tiids_that_need_twitter = """sl1uu922rwpl1htii64upwjs
zh61suvqesowwqi1qcn0v413
lm7gvssk3ned3qhpv5ikjd8b
45ocb53m15t4u30eunkbf92x
6lxy1sfq9svzwqb4sh8ohr4q
r1racghivuicher8nq1fkz82
1d8vevthl6xrwco12rmf14ic
hjxho94nebgn8t1fo48jyyhp
70zcisr2h3mqjg78ijhhy79v
pvtoq59zeyia9tq4ilmolf35
s5dm7hfgyuxx1c0gcuvaextf
f2posteqa35q84iu33ikmzkp
a6ajxseag82hxrio369umprl
jx419f8i8lqtvi68npzsfnyx
bgkkpmxhat1djku3upmkqrwr
d50ke8xfskcnvgvqgnxoois5
okjvzk1whrc011pyv7w42dd5
a298ulu11qr2yuwfhpzm2801
c97buephmpca1nn4799db1wr
3u7hxms6im72vn8ub3pv30ah
felqgjke26f9d2r2lmggpi2a
ilwmmkpb5mvx924rov6yvgig
15qjvbgebijdnop7p2ifc09q
g6ryzpqavyu0l8cgsrwpw9vh
uv1p4j1j4l5656dbx978shuc
hhknfkhiy5cvc7m7jn9vfgqd
w4o5x7m1f23823ahjnma743d
p4onpscmtcpcrr9r22acnebt
69vifn9flb5nnmv735awgcmh
0o30n302sy8lwqv5g67bg9gg
17ngn4ti810fxgn90vlzljtu
giwqfxmc2dqxw1b6avclk9qb
8ckpm7q6a2buxshbqopyzg9p
gdljk8i2sg01oytp7o3q2crm
0yrtft7b01oouuoz5hpbkskb
y0pmyunj5znn7cmazucf09hx
jktvdxmbn4nem4l9b7d6yvyv
j2bmwqywplcincrwvh6p4qk6
65fgkpdp6kybj13fy3xsb961
i5vegyk04xyba64dcz7cqz8q
x3jc1jmgqfoz9y94fjg0pec2
6frn0rtg6l7t91t4v28b5y50
kf0k540w9b4wukoqy8o63ae4
pt7y7bf3jfip023ajtjk17s6
488a9x5ssvub8rqcqaew98lt
4b3b9af4b4rwtmiitro8sv9z
64tgc9n19c3mfe76yxadhw6l
jlukzsjav2qimvz9ih3x1aji
grpyyurkbu4pvtvg3h67e0vj
t0uqedhhm3cp0kpsc4qxyepi
8ywe3gwmw02fv94405iyxmet
lhc35rcqzgiba4d6p3cz9xbz
b1lo52mh7e6rekiz92yakm11
r5mzei90q07508ir8ft14cnz
e26ynzyab4phpkxkwtsvf4x7
zneszixq7g7yge82gd0n1ul3
t0pa5jgla6z2dgtrdggfq296
btvncq5elw4kthb3ywcgly77
njeuf5dczdrk6cwr2qbz9rqm
hlw7fs29oat1ctxh0ihgs28b
aaohg9c9qq83s8may29ww0wk
cmyk28wu4q89pexz4h5edupl
demmcgq7ulnt5kobeco0mvth
br07ajyxyhmm876ol0fm2yzl
sdtdbsti08cb6gkw611w1mtx
8egh0fqk4nv7j0u1rxj5orfr
c16d4qksp9h2jkrmg4ru2pw1
a6muyoasv3z2u7wj17cvac34
67jcn2cohrsdruw5p58xsqsw
0jtrjwbc2oelm9wltgdbdle2
3lsyfgzymtf11xg4xkh7dybm
gtjorswnq623j5n6wzkmuuld
l2qkjj34kzzpbs7xspbgyrht
u3a4vqmggr9ukflyjcv518f9
4mpl1loiox7v14vyxebzus0o
e6c3886he42f3nti63lgvfty
zhsrbbf2s90l82n5hw1bh7n2
jrqsxkat2jo6p1n535itd606
0wing0tnp9bkcjrob9bt3o14
1c2yevp6ab1irsi5pj9kjq28
lq0bpxp8hdpimm2x7y762sc4
vkxw4tfaeorhxvebgjyzrud8
osrbcs0cw0kh25hqiea1ykwm
w35if1hj7olh5toak735hj0b
3tidqm0754usgu449tda4hbx
m8gt2ohqkvuum1ngro3sqja7
x4rhw3rrwyrj0hcovspgil8i
r18g0xk2zr8lyowaocv3o7i0
oh3t5r4rptxhlolteyrvug2e
yd6pukcbts4eqrok0bgiewv9
m71y3mz9ke0eam3adfpgum63
7xac5qbl976tftbvfpmb3k5y
tjpellmuacd4uu5d5cad7lli
5qgj0w33jd4t4hz1p7tncw75
w03mhx7zc9ddjvirhpmkcmsq
uhuo9bimpjmhhh785zo3xfoj
ojp2u3qmhqv4otyo4pfk8p02
h9g63408rk49ez75vipkm0ha
6t6slztfhv27nk9qnhxxw975
fy8ksfq6r6rezbxd0q3i1rwj
i3pip19q23dj8pbrcdq5jy35
pgknf6xpichxwo8nshiddq3a
kya7oib5gdlwnfib04u7p8ib
5um200afhbhpxrgcnvlm91cf
dkbskng33303kuuov864cmcj
5cf3vkabdq5bk17zvimjvczk
awnftbzp51455bijcskhs2fe
ucjn1f2z6r5pl699picnvy2q
6yhgpro43ffk0mwm1n3tqa3e
qum5x97o7zx2bwihaoy1tcn3
zcn6gf43gi5lskb5srcm095d
1ckfdr48q0qwj7843n8fpriv
fbnaqxpy9103zp8v905rhn2s
jik17rcfqglqs9v0emri43un
1rwodve1ruf33rua10gk1c4t
yufof3pt0dqekm61ohpd1jwb
5wv6lopcpjhz1ky92vqok0bx
8juef5ec0bkz4kr9jqngwuv4
8s49x54l1eqq3pewrmgfcjzx
4twzegx2pl3oz2uhbcb1x4f4
pdeaejqkx38k19zkub8bythe
eqthbhp1zkcb02bc8uvjghyq
ibo5cmlnxqf677x86vq7j88q
z2oh9x6bka7rvgvl9dcie7bo
7bygy9intomvs6ml2fyo52kj
gwtst3ehtkuehyx1aezz9xjn
62xsh843o7xj8st1qq0oxxjc
vdfkt8eori974kw65mhwzfr2
m18r6lm4thatnp93q0st7etd
macpkjiqe58doipmgdwxt4cf
08y8ln2088y9tib6pmrdmwip
1bn07ntyhneja4ivaet628xu
2e5g3nfr319vemxszkixithv
pecsccvqw35itm3ag56a4fed
5v50kxc451vt3jo4iyc7ia9j
gn0g155vykzk0okwrma9o2xi
zcjv1lcm6gnagjlwd8drqnyq
a6o9puscmofe56h00qbeq2xp
x56z3mik8wn5qjurpkmtycbn
8nr5tkhufty53vii7swbuxse
6bavc4y68i1qjazxm4xgv7mg
r7xgltpnsqdbh0o9f8ukmkw2
aiotseszjefmbpa26gs1wk3u
zn8wxpz1pls0u5eqxaox7n4z
bykp8w4evoxyy03il2uazbcy
9my6enq1hokihjrc3zpoxq9a
zhwnu4bdm1uibisd53ofed00
936zz2susgxb99deiczt6pwa
26ryp7ir3qb604jkj03unboy
kr5jlq5663gedxkk90vgsjyu
burlvd97dfhvl7nv3wo5h2d4
319eafcqssx8f0zqx4r3zkcu
q138x4ex7kpa9txzn5lt5qgl
6u3yz8imztkb5tqo3zfsdokl
bxchgm1mphgcygje3369163q
waoc15ocxp3k6y9aawfr80fx
b2xtftp1qyo5df0rwx1siygz
6vc1aoij16viyl5fs30ylbo9
vaadffdnny9aefqvop3fyhck
82bcjprhgc2otxzxexrn29e7
l9hjjoz0skrpfm82q3tjcdcb
pfmdz9rj0bhues8ibdu8ifii
xp5zhmnvhgripuqrgabxf193
ll0p2wvbyekuuq35rwkzjko9
9m6wrwj4d6x5zxx3ofn4rxbp
rqeaut68j7yahb72eafokd4u
fw0pqx98yvnh5iz788q3hq7z
itzjpeodtrm0l04xj0t2r912
gruwkmh6nk3n0y4bcy2v2gkf
e7xxuutdn2tg95yd3vmy2dvk
n4dx7wi16vuh4foke76mcrq8
4v8r9tj03tdawld0whkomya1
rjm0s4lc6byln1e0nj3uncxj
5823s7fzkzg4vf1j8gz9sam0
fuqt1t6n9uhka9uffuviacp1
2l5flpuodr4ysfxnwboo035o
625f4jdv656ifzqeby3yqelr
m6v24r4rj4cv3o6w10grhyrw
5sev4d3njjcpx0gph6svdhki
zts5d12g9h3ie26glmbuwm7a
nqqmknggx8n1tw0tlfoq3f96
m4nwxt2ri4dok2kdsxj23hmf
mx6ybyovx52zv2xivapcx4wc
xam3w6za5li400xqhjwl2tj0
yyoio9ih1mvgtdp7ufepy9e0
zzygywpdt4ovtis5o6ur7yo1
t7kqv8wzvnininiocf84cgcc
owr4uaw1c0gxf0pt6qxy3mfs
426rvbi8t7re14gj9exby904
2e3sog7kixaqgyrqszvsio6p
sp7oy1ptjiv882abzyo4djmi
76ceudi9798ovfsj3532dtww
i8w4ek4ffwaiwep5caj10utp
d5flksblur2l1ysaeknl4f40
vt7j9q7w1q5mddxujna4hqif
fnmrqs3x18erjts01ly3mdw5
84njrijxirhm508jlr5jaxxg
uxah0oya84pcfwugc39hla4q
3d646fot59rtxt477uxp9zn5
ixlk424hu1rcpal4q0l6khpk
dauqkeqq4upnourvfxuhp8bg
rrj69gb2yxt7zsrs6puxpwrw
gxusjwalmjxslk3o1piyi89w
xrnlsh88lup26pig0j4er4ne
9w4ikrwqbhc4jicjwk0dxszn
60jlacjpe61k4iobi9hini9b
7inak86xtl558f6bpffzhu1q
p1oj8ovyj9ik6r2wegngcv0i
agoes2yso13uwfo5yqb0xkbn
mbohxc65pwgc9ypv6dl20f6c
wy8bd62l7mcrhe8mofpmk8fk
5jugcbn9anjkrb84y3zyqwix""".split()

def refresh_twitter(min_tiid=None):
    if min_tiid:
        q = db.session.query(Product).filter(Product.profile_id != None).filter(Product.tiid>min_tiid)
    else:
        q = db.session.query(Product).filter(Product.profile_id != None).filter(Product.tiid.in_(tiids_that_need_twitter))

    start_time = datetime.datetime.utcnow()
    number_considered = 0.0
    number_refreshed = 0
    for product in windowed_query(q, Product.tiid, 25):
        number_considered += 1
        try:
            if product.biblio.repository=="Twitter" and len(product.metrics)==0:
                print "refreshing", product.tiid, number_refreshed
                refresh_products_from_tiids([product.tiid], source="scheduled")
                number_refreshed += 1
                if number_refreshed >= 15:
                    #api limit
                    print "refreshed 15, so breaking now"
                    break
        except AttributeError:
            pass


def run_through_twitter(url_slug=None, min_url_slug=None):
    if url_slug:
        q = db.session.query(Profile).filter(Profile.twitter_id != None).filter(Profile.url_slug==url_slug)
    else:
        if min_url_slug:
            q = db.session.query(Profile).filter(Profile.twitter_id != None).filter(Profile.url_slug>=min_url_slug)
        else:
            q = db.session.query(Profile).filter(Profile.twitter_id != None)

    start_time = datetime.datetime.utcnow()
    number_considered = 0.0
    number_markups = 0.0
    
    from birdy.twitter import AppClient, TwitterApiError, TwitterRateLimitError, TwitterClientError
    from StringIO import StringIO
    import boto
    import pickle
    import time

    client = AppClient(os.getenv("TWITTER_CONSUMER_KEY"), 
                    os.getenv("TWITTER_CONSUMER_SECRET"),
                    os.getenv("TWITTER_ACCESS_TOKEN"))


    conn = boto.connect_s3(os.getenv("AWS_ACCESS_KEY_ID"), os.getenv("AWS_SECRET_ACCESS_KEY"))
    bucket_name = os.getenv("AWS_BUCKET", "impactstory-uploads-local")
    bucket = conn.get_bucket(bucket_name, validate=False)

    for profile in windowed_query(q, Profile.url_slug, 25):
        number_considered += 1
        twitter_handle = profile.twitter_id

        logger.info(u"{url_slug} has twitter handle {twitter_handle}".format(
            url_slug=profile.url_slug, twitter_handle=twitter_handle))

        try:
            r = client.api.statuses.user_timeline.get(screen_name=twitter_handle, 
                    count=200, 
                    contributor_details=True, 
                    include_rts=True,
                    exclude_replies=False,
                    trim_user=False)
        except TwitterRateLimitError:
            print "rate limit error, sleeping 60 seconds"
            time.sleep(60)
        except TwitterApiError:
            print "TwitterApiError error, skipping"
            continue
        except TwitterClientError:
            print "TwitterClientError error, skipping"
            continue

        print "saving to aws"
        path = "twitter"
        key_name = "twitter_{twitter_handle}_1-200.json".format(
            twitter_handle=twitter_handle)
        full_key_name = os.path.join(path, key_name)
        k = bucket.new_key(full_key_name)
        # file_contents = r.data.items()
        file_contents = pickle.dumps(r.data)
        length = k.set_contents_from_file(StringIO(file_contents))
        print "saved length", length, "with "

        if int(r.headers['x-rate-limit-remaining']) < 10:
            print "running out of rate limit, sleeping 60 seconds"
            time.sleep(60)



def main(function, args):
    if function=="emailreports":
        if "url_slug" in args and args["url_slug"]:
            email_report_to_url_slug(args["url_slug"])
        else:    
            email_report_to_everyone_who_needs_one(args["max_emails"])
    elif function=="dedup":
        deduplicate_everyone()
    elif function=="productdeets":
        add_product_deets_for_everyone(args["url_slug"], args["skip_until_url_slug"])
    elif function=="refsets":
        build_refsets(args["save_after_every_profile"])
    elif function=="embed":
        collect_embed(args["min_tiid"])
    elif function=="linked-accounts":
        linked_accounts("slideshare", args["url_slug"])
    elif function=="refresh_twitter":
        refresh_twitter()
    elif function=="twitter":
        run_through_twitter(args["url_slug"], args["min_url_slug"])



if __name__ == "__main__":

    db.create_all()
    
    # get args from the command line:
    parser = argparse.ArgumentParser(description="Run stuff.")
    parser.add_argument('function', type=str, help="one of emailreports, refsets, dedup, productdeets")
    parser.add_argument('--url_slug', default=None, type=str, help="url slug")
    parser.add_argument('--save_after_every_profile', action='store_true', help="use to debug refsets, saves refsets to db after every profile.  slow.")
    parser.add_argument('--skip_until_url_slug', default=None, help="when looping don't process till past this url_slug")
    parser.add_argument('--max_emails', default=None, type=int, help="max number of emails to send")
    parser.add_argument('--min_tiid', default=None, type=str, help="min_tiid")
    parser.add_argument('--min_url_slug', default=None, type=str, help="min_url_slug")

    args = vars(parser.parse_args())
    print args
    
    print u"daily.py starting."
    main(args["function"], args)

    db.session.remove()
    



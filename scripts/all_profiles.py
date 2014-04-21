__author__ = 'jay'
import requests
import csv
import random

def get_slugs():
    url = "https://dataclips.heroku.com/empnpduodrmkvhdsvhhlfhjqkzto.json"
    rows = requests.get(url).json()["values"]

    slugs = [row[0] for row in rows]
    return slugs


def get_awards(slug):
    url = "https://impactstory.org/user/{slug}/awards".format(
        slug=slug
    )
    print "requesting this url: ", url
    resp = requests.get(url)
    return resp.json()


def pick_random_bronze_or_better_oa_award():
    slugs = get_slugs()

    random.shuffle(slugs)
    for slug in slugs:
        awards = get_awards(slug)
        oa_award = awards[0]  # this won't always be true
        print "checking ", slug, "level", oa_award["level"]
        if oa_award["level"] < 4:
            print "and we have a winner: ", slug
            break

    return


def write_to_csv(slugs):
    rows = []
    for slug in slugs:
        awards = get_awards(slug)
        vals_list = awards[0]["extra"].values()
        rows.append(vals_list)


    # write the new file as CSV
    with open('oa_dist.csv', 'wb') as csvfile:
        newCsv = csv.writer(csvfile, delimiter=',',
                                quotechar='"', quoting=csv.QUOTE_MINIMAL)
        for row in rows:
            newCsv.writerow(row)



pick_random_bronze_or_better_oa_award()











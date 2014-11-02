"""
Joins a list of country populations and a list of alpha-2 iso country codes.

Run from ~/projects/total-impact-webapp/scripts

country_populations.csv comes from many sources, compiled by the World Bank:
http://databank.worldbank.org/data/views/reports/tableview.aspx. It's been
slightly modified when some of the codes were wrong.

iso_country_codes comes from http://datahub.io/dataset/iso-3166-1-alpha-2-country-codes/resource/9c3b30dd-f5f3-4bbe-a3cb-d7b2c21d66ce
and had to have around 10 lines modified, updated, or added using wikipedia data
* http://en.wikipedia.org/wiki/ISO_3166-1_alpha-3
* http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2

"""

import csv
import json


def dict_by_alpha2():
    # make a dictionary to lookup alpha2 codes from alpha3 keys
    country_codes = {}
    with open('iso_country_codes.csv', 'Urb') as csvfile:
        rows = csv.reader(csvfile, delimiter=',')
        for row in rows:
            country_codes[row[1]] = row[0]

    return country_codes


def make_population_dict(alpha2_to_alpha2_table):
    # make a population dict keyed by alpha2 iso code
    populations = {}
    with open('country_populations.csv', 'Urb') as csvfile:
        rows = csv.reader(csvfile, delimiter=',')
        for row in rows:
            alpha2_code = alpha2_to_alpha2_table[row[2]]
            populations[alpha2_code] = row[3]

    print populations
    return populations


def make_internet_usage_per_100_dict(alpha2_to_alpha2_table):
    internet_users = {}
    with open('country_internet_users.csv', 'Urb') as csvfile:
        rows = csv.reader(csvfile, delimiter=',')
        for row in rows:
            try:
                alpha2_code = alpha2_to_alpha2_table[row[1]]
            except KeyError:
                print "this country isn't in the alpha2 table:", row[0], row[1]
                pass

            if row[2]:
                users_per_100 = row[2]
            else:
                # for NAs, use the world avg
                users_per_100 = 38.13233855

            internet_users[alpha2_code] = users_per_100

    print internet_users
    return internet_users


def make_total_internet_users_dict(pop_dict, internet_per_100_dict):
    ret = {}
    for country_code, users_per_100 in internet_per_100_dict.iteritems():
        print country_code, ":", users_per_100
        my_population = pop_dict[country_code]
        ret[country_code] = int(float(users_per_100) * int(my_population) / 100)

    print ret
    return ret



# procedural code:
print "making the ISO alpha2 to alpha3 talble"
alpha2_to_alpha3 = dict_by_alpha2()

print "making the population dict, keyed by alpha2"
pop_dict = make_population_dict(alpha2_to_alpha3)

print "making the internet users per 100 dict, keyed by alpha2"
internet_usage_per_100_dict = make_internet_usage_per_100_dict(alpha2_to_alpha3)

print "making the total internet users dict"
total_internet_users_dict = make_total_internet_users_dict(pop_dict, internet_usage_per_100_dict)

print "saving country_populations.json"
with open("country_populations.json", "w") as outfile:
    json.dump(pop_dict, outfile)

print "success!"
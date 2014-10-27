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


# make a dictionary to lookup alpha2 codes from alpha3 keys
country_codes = {}
with open('iso_country_codes.csv', 'Urb') as csvfile:
    rows = csv.reader(csvfile, delimiter=',')
    for row in rows:
        country_codes[row[1]] = row[0]


# make a population dict keyed by alpha2 iso code
populations = {}
with open('country_populations.csv', 'Urb') as csvfile:
    rows = csv.reader(csvfile, delimiter=',')
    for row in rows:
        alpha2_code = country_codes[row[2]]
        populations[alpha2_code] = row[3]

print "saving country_populations.json"
print populations

with open("country_populations.json", "w") as outfile:
    json.dump(populations, outfile)

print "success!"
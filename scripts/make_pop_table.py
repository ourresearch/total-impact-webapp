"""
Joins a list of country populations and a list of alpha-2 iso country codes.

Run from ~/projects/total-impact-webapp/scripts
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
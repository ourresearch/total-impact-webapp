import re
import json

def make_country_key_to_iso_code_dict(country_lines):
    country_key_to_iso_code = {}
    for line in country_lines:
        m = re.match("\((\d+),", line)
        if m is not None:
            country_key = int(m.group(1))
            iso_code = line.split(",")[1].replace("'", "").strip()
            country_key_to_iso_code[country_key] = iso_code

    return country_key_to_iso_code





def make_uni_list(uni_lines, iso_code_dict):
    ret = []
    for line in uni_lines:
        uni_obj = uni_obj_from_line(line)
        ret.append(uni_obj)

    return [uni for uni in ret if uni is not None]


def uni_obj_from_line(line):
    print line
    if not line.startswith("("):
        return None

    uni_country_key = int(line.split(",")[1])
    uni_name = line.split(",")[2].replace("'", "").strip()
    uni_url = line.split(",")[3].replace("'", "").strip()

    uni_iso_code = iso_code_dict[uni_country_key]

    return {
        "name": uni_name,
        "country": uni_iso_code,
        "url": uni_url
    }








lines = open("world_university_names.sql", "r").read()
country_lines = lines.split("[split here]")[0].split("\n")
uni_lines = lines.split("[split here]")[1].split("\n")

iso_code_dict = make_country_key_to_iso_code_dict(country_lines)
uni_list = make_uni_list(uni_lines, iso_code_dict)

with open("unis.json", "w") as outfile:
    json.dump(uni_list, outfile, sort_keys=True, indent=4)

print "success!"
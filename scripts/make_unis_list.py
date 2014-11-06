import re
import json
import shortuuid


# input comes from Webometric ratings, as compiled here:
# https://github.com/gedex/World-University-Names-Database
input_file = "world_university_names.sql"

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
        uni_obj = uni_obj_from_line(line, iso_code_dict)
        ret.append(uni_obj)

    return [uni for uni in ret if uni is not None]


def uni_obj_from_line(line, iso_code_dict):
    print line
    if not line.startswith("("):
        return None

    uni_country_key = int(line.split(",")[1])
    uni_name = line.split(",")[2].replace("'", "").strip()
    uni_url = line.split(",")[3].replace("'", "").replace(")", "").strip()

    uni_iso_code = iso_code_dict[uni_country_key]

    return {
        "name": uni_name,
        "country": uni_iso_code,
        "url": uni_url
    }


def write_uni_list(uni_list):
    lines_to_write = []
    for uni in uni_list:
        uni_tuple = (
            uni["name"],
            uni["country"],
            uni["url"]
        )
        lines_to_write.append(
            "|".join(uni_tuple) + "\n"
        )
    with open('unis.csv', 'w') as f:
        f.writelines(lines_to_write)


lines = open(input_file, "r").read()
country_lines = lines.split("[split here]")[0].split("\n")
uni_lines = lines.split("[split here]")[1].split("\n")

iso_code_dict = make_country_key_to_iso_code_dict(country_lines)
uni_list = make_uni_list(uni_lines, iso_code_dict)

write_uni_list(uni_list)

print "success!"
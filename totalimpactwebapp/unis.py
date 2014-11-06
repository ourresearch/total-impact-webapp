import os
import codecs

unis_list = []


def load_list():
    current_dir = os.path.dirname(__file__)
    rel_path_to_unis_csv = "data/unis.csv"
    absolute_path_to_unis_csv = os.path.join(current_dir, rel_path_to_unis_csv)

    with codecs.open(absolute_path_to_unis_csv, "r", "utf-8") as myfile:
        unis_str = myfile.read()
        for line in unis_str.split("\n"):
            cells = line.split("|")
            if len(cells) == 3:
                unis_list.append({
                    "name": cells[0],
                    "country": cells[1],
                    "url": cells[2]
                })


def filter_list(name_starts_with):
    return [
        uni["name"]
        for uni in unis_list
        if uni["name"].lower().startswith(name_starts_with.lower())
    ]






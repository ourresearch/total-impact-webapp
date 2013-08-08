"""
Modify a CSV list of user emails so it imports into MailChimp the way we want.

This is for the MVP email we are sending, that needs to have a bunch of links
to users' collections.
"""

import csv

liTemplate = """
<li>
    <a href='http://impactstory.org/collection/{id}'>
        http://impactstory.org/collection/{id}
    </a>
</li>"""


# make the new file as a list
newUsersList = []
with open('../../user-email-info.csv', 'rb') as csvfile:
    users = csv.reader(csvfile, delimiter=',')
    for row in users:
        if len(row) == 0:
            continue

        # make the slug into a link to the collection
        row.append("<a href='http://impactstory.org/{slug}'>your profile</a>"
            .format(slug=row[0]))

        # make the list of collection IDs into a UL of links
        collIds = row[4].split(";")
        collUrlsLis = [liTemplate.format(id=id) for id in collIds]
        collUrlsUl = "<ul>" + "\n".join(collUrlsLis) + "</ul>\n"
        row.append(collUrlsUl)
        newUsersList.append(row)


# write the new file as CSV
with open('../../user-email-info-plus.csv', 'wb') as csvfile:
    newCsv = csv.writer(csvfile, delimiter=',',
                            quotechar='"', quoting=csv.QUOTE_MINIMAL)
    for row in newUsersList:
        newCsv.writerow(row)


from totalimpactwebapp import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    given_name = db.Column(db.String(64))
    surname = db.Column(db.String(64))
    email = db.Column(db.String(120), unique=True)
    url_slug = db.Column(db.String(100), unique=True)
    collection_id = db.Column(db.String(12))

    @property
    def full_name(self):
        name = (self.given_name + " " + self.surname).strip()
        if name:
            return name
        else:
            return "Anonymous"

    def __init__(self, email, collection_id, **kwargs):
        self.email = email
        self.collection_id = collection_id

        super(User, self).__init__(**kwargs)
        self.url_slug = self.make_url_slug(self.full_name)

    def make_url_slug(self, full_name):
        name_list = full_name.split(" ")
        return "".join([x.capitalize() for x in name_list])


    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.id)

    def __repr__(self):

        return '<User {name}>'.format(name=self.full_name)
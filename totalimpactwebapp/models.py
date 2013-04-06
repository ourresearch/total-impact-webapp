from totalimpactwebapp import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    given_name = db.Column(db.String(64))
    surname = db.Column(db.String(64))
    email = db.Column(db.String(120), unique=True)
    url_slug = db.Column(db.String(100), unique=True)
    collection_id = db.Column(db.String(12))

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.id)

    def __repr__(self):

        try:
            name = (self.given_name + " " + self.surname)
        except AttributeError:
            name = "unknown"

        return '<User {name}>'.format(name=name)
from totalimpactwebapp import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    given_name = db.Column(db.String(64))
    surname = db.Column(db.String(64))
    email = db.Column(db.String(120), unique=True)
    collection_id = db.Column(db.String(12))


    def __repr__(self):
        return '<User %r>' % (self.firstname + " " + self.lastname)
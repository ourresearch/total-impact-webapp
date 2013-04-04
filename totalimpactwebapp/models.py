from totalimpactwebapp import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    firstname = db.Column(db.String(64))
    lastname = db.Column(db.String(64))
    email = db.Column(db.String(120), unique=True)


    def __repr__(self):
        return '<User %r>' % (self.firstname + " " + self.lastname)
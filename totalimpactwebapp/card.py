from totalimpactwebapp import db


class Card(db.Model):
    pass
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.Text)
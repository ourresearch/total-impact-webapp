from totalimpactwebapp import db


class Interaction(db.Model):

    interaction_id = db.Column(db.Integer, primary_key=True)
    ip = db.Column(db.Text)
    date = db.Column(db.DateTime())
    event = db.Column(db.Text)
    extra = db.Column(db.Text)



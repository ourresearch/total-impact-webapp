from totalimpactwebapp import db


class Interaction(db.Model):

    interaction_id = db.Column(db.Integer, primary_key=True)
    ip = db.Column(db.Text)
    country = db.Column(db.Text)
    timestamp = db.Column(db.DateTime())
    event = db.Column(db.Text)
    headers = db.Column(db.Text)



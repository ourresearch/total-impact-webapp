from totalimpactwebapp import db


class Card(db.Model):
    pass
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.Text)  # readability, flags, new_metrics
    user_id = db.Column(db.Integer, unique=True)
    tiid = db.Column(db.Text, unique=True)
    granularity = db.Column(db.Text)  # profile or product
    metric = db.Column(db.Text)  # mendeley:views, scopus:citations
    weekly_diff = db.Column(db.Text)
    current_value = db.Column(db.Text)
    percentile_current_value = db.Column(db.Text)
    median = db.Column(db.Float)
    threshold_awarded = db.Column(db.Text)
    num_profile_products_this_good = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime())
    weight = db.Column(db.Float)


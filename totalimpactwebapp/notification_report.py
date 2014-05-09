from totalimpactwebapp.card import Card
from totalimpactwebapp import db

import datetime


class NotificationReport(object):

    def __init__(self, user):
        self.user = user
        self.cards = Card.query.filter(Card.user_id == user.id).all()

    def sort(self):
        pass

    def filter(self):
        pass

    def get_dict(self):

        self.sort()
        self.filter()

        response = {
            "user": self.user.dict_about(),
            "cards": [card.to_dict() for card in self.cards]
        }
        return response

    def __repr__(self):
        return u'<NotificationReport {user_id} {len_cards}>'.format(
            user_id=self.user.id, len_cards=len(self.cards))




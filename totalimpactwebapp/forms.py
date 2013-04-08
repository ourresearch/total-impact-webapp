from wtforms import Form, BooleanField, TextField, PasswordField, validators


class LoginForm(Form):
    email = TextField('Email Address', [
        validators.Length(min=6, max=100),
        validators.required()
    ])
    password = PasswordField('New Password', [
        validators.Required(),
        validators.EqualTo('confirm', message='Passwords must match')
    ])
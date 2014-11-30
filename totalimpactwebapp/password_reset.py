import mandrill
import os
import logging
from itsdangerous import TimestampSigner, SignatureExpired, BadTimeSignature, BadSignature
from totalimpactwebapp.profile import Profile, get_profile_from_id


logger = logging.getLogger("ti.password_reset")


class PasswordResetError(Exception):
    pass


def send_reset_token(email, url_base):

    # make the signed reset token
    s = TimestampSigner(os.getenv("SECRET_KEY"), salt="reset-password")
    reset_token = s.sign(email)

    full_reset_url = url_base + "reset-password/" + reset_token

    # send the email here...
    mailer = mandrill.Mandrill(os.getenv("MANDRILL_APIKEY"))

    text = """Hi! You asked to reset your ImpactStory password. To do that, just
copy and paste the URL below into your browser's address
bar:\n\n{url}\n\n(If you didn't ask to reset your password, you can just ignore
this message).\nBest,\nThe ImpactStory team""".format(url=full_reset_url)

    html = """<p>Hi! You asked to reset your ImpactStory password. To do that, just
<a href="{url}">click this reset link</a>, or copy and paste the URL below into your
browser's address bar:</p><pre>{url}</pre><p>(If you didn't ask to reset your password,
you can just ignore this message.)<br>Best,<br>The ImpactStory
team</p>""".format(url=full_reset_url)

    msg = {
        "text": text,
        "html": html,
        "subject": "Password reset link",
        "from_email": "team@impactstory.org",
        "from_name": "ImpactStory support",
        "to": [{"email":email, "name":"ImpactStory user"}],  # must be a list
        "tags": ["password-resets"],
        "track_opens": False,
        "track_clicks": False
    }
    mailer.messages.send(msg)
    logger.info(u"Sent a password reset email to " + email)

    return True


def reset_password_from_token(reset_token, new_password):
    s = TimestampSigner(os.getenv("SECRET_KEY"), salt="reset-password")
    try:
        email = s.unsign(reset_token, max_age=60*60*24).lower()  # 24 hours

    except SignatureExpired:
        raise PasswordResetError("expired-token")

    except (BadTimeSignature, BadSignature):
        raise PasswordResetError("invalid-token")

    user = get_profile_from_id(email, "email", include_products=False)
    user.set_password(new_password)
    return user


def reset_password(id, id_type, current_password, new_password):
    user = get_profile_from_id(id, id_type, include_products=False)
    if user.check_password(current_password):
        user.set_password(new_password)
    else:
        raise PasswordResetError("invalid-password")

    return user









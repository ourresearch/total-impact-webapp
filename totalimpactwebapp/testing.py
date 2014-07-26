test_email_domains = [
    "test-impactstory.org",
    "e.com",
    "example.com"
]

def is_test_email(email):
    for domain in test_email_domains:
        if email and email.endswith("@" + domain):
            return True

    return False
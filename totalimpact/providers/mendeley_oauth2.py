# -*- coding: utf-8 -*-
#!/usr/bin/env python
### Example code to access the Mendeley OAuth2 API
### Author: Juan Pablo Alperin

import requests
import requests.auth
import urllib
CLIENT_ID = ''
CLIENT_SECRET = ''
REDIRECT_URI = 'http://localhost/' # or whatever you've set it to in your API
AUTHORIZE_URL = 'https://api-oauth2.mendeley.com/oauth/authorize'
TOKEN_URL = 'https://api-oauth2.mendeley.com/oauth/token'

def make_authorization_url():
    params = {"client_id": CLIENT_ID,
              "response_type": "code",
              "redirect_uri": REDIRECT_URI,
              "duration": "temporary",
              "scope": "all"}
    url = AUTHORIZE_URL + "?" + urllib.urlencode(params)
    return url

def get_token(code):
    client_auth = requests.auth.HTTPBasicAuth(CLIENT_ID, CLIENT_SECRET)
    post_data = {"grant_type": "authorization_code",
                 "code": code,
                 "redirect_uri": REDIRECT_URI}
    response = requests.post(TOKEN_URL,
                             auth=client_auth,
                             data=post_data)
    token_json = response.json()
    return token_json["access_token"], token_json["refresh_token"]

def renew_token():
    client_auth = requests.auth.HTTPBasicAuth(CLIENT_ID, CLIENT_SECRET)
    headers = {"Authorization": "bearer " + access_token}
    post_data = {"grant_type": "refresh_token",
                 "refresh_token": refresh_token}
    response = requests.post(TOKEN_URL,
                             auth=client_auth,
                             data=post_data)
    token_json = response.json()
    return token_json["access_token"], token_json["refresh_token"]

# go to this URL and login, get the code from the response URL
print "Go to the following URL, login, and grab the code from the URL of the redirect"
print "Your browser will have something like: http://localhost/?code=XxXxXxXxXxXxXxXxXxXxXxXxXx"
print "Copy everything after the ="
print
print make_authorization_url()
print

# The paste your code here, between ' '
code = ''

# this is to stop executing if you haven't entered a code yet
if code == '':
    exit

# note, the following line can only be executed once. 
# Once you have your access code, it will fail unless you get a new code
access_token, refresh_token = get_token(code)
print "This is your access token, you can use it directly in a URL"
print access_token

# If your script is querying for a long time, you'll need to renew your token
# run the following before the hour is up
access_token, refresh_token = renew_token()
print access_token

def search_by_id(id, doc_type=False):
    '''
    Search Mendeley by an ID
    See http://apidocs.mendeley.com/home/public-resources/search-details
    '''
    headers = {"Authorization": "bearer " + access_token}
    encoded_id = urllib.quote(urllib.quote(id, safe=''), safe='') # double encode the DOI
    print encoded_id
    data = {}
    if (doc_type):
        data['type'] = doc_type
    url = 'https://api-oauth2.mendeley.com/oapi/documents/details/' + encoded_id
    print url
    try: 
        response = requests.get(url, params=data, headers=headers)
        return response.json()
    except ValueError:
        print 'Invalid response'
        return False

def search_by_text(text):
    '''
    Search Mendeley by any string
    See http://apidocs.mendeley.com/home/public-resources/search-terms
    text has to be a unicode string
    '''
    headers = {"Authorization": "bearer " + access_token}
    encoded_text = urllib.quote(text.encode('utf8'), safe='')
    url = 'https://api-oauth2.mendeley.com/oapi/documents/search/' + encoded_text
    try: 
        response = requests.get(url, headers=headers)
        return response.json()
    except ValueError:
        print 'Invalid response'
        return False

# Examples: 
# search by title (or any string) (use unicode strings)
response = search_by_text(u'Impact of Social Sciences – Altmetrics could enable scholarship from developing countries to receive due recognition')
print response['documents'][0]
print 

# search by a uuid
print search_by_id('8d796d0e-76b6-3372-b65e-dd7eeeb2a471')
print

# search by DOI
print search_by_id('10.1080/13538322.2013.802573', 'doi')
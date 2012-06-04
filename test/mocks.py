import os

class SimpleResponse(object):
    pass

class Requests():

    my_resp = SimpleResponse()

    def get(self, url):

        resp_loc = self.get_resp_loc(url)
            
        self.my_resp.text = open(resp_loc).read()
        return self.my_resp 

    def get_resp_loc(self, url):
        data_dir = os.path.join( os.path.dirname(__file__), "data" )
        
        if "total-impact-webapp/commits" in url:
            return os.path.join(data_dir, "github_commits", "webapp.json")
            
        elif "total-impact-core/commits" in url:
            return os.path.join(data_dir, "github_commits", "core.json")
        
        else:
            raise Exception("unexpected url: " + url)
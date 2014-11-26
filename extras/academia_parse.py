import argparse
import re
from multiprocessing.pool import ThreadPool as Pool
import requests
import bs4
 
# root_url = 'http://pyvideo.org'
# index_url = root_url + '/category/50/pycon-us-2014'
 
 
# def get_video_page_urls():
#     response = requests.get(index_url)
#     soup = bs4.BeautifulSoup(response.text)
#     return [a.attrs.get('href') for a in soup.select('div.video-summary-data a[href^=/video]')]
 
 
# def get_video_data(video_page_url):
#     video_data = {}
#     response = requests.get(root_url + video_page_url)
#     soup = bs4.BeautifulSoup(response.text)
#     video_data['title'] = soup.select('div#videobox h3')[0].get_text()
#     video_data['speakers'] = [a.get_text() for a in soup.select('div#sidebar a[href^=/speaker]')]
#     try:
#         video_data['youtube_url'] = soup.select('div#sidebar a[href^=http://www.youtube.com]')[0].get_text()
#         response = requests.get(video_data['youtube_url'], headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36'})
#         soup = bs4.BeautifulSoup(response.text)
#         video_data['views'] = int(re.sub('[^0-9]', '',
#                                          soup.select('.watch-view-count')[0].get_text().split()[0]))
#         video_data['likes'] = int(re.sub('[^0-9]', '',
#                                          soup.select('.likes-count')[0].get_text().split()[0]))
#         video_data['dislikes'] = int(re.sub('[^0-9]', '',
#                                             soup.select('.dislikes-count')[0].get_text().split()[0]))
#     except:
#         # video does not have a youtube URL
#         video_data['views'] = 0
#         video_data['likes'] = 0
#         video_data['dislikes'] = 0
#     return video_data
 
 
# def parse_args():
#     parser = argparse.ArgumentParser(description='Show PyCon 2014 video statistics.')
#     parser.add_argument('--sort', metavar='FIELD', choices=['views', 'likes', 'dislikes'],
#                         default='views',
#                         help='sort by the specified field. Options are views, likes and dislikes.')
#     parser.add_argument('--max', metavar='MAX', type=int, help='show the top MAX entries only.')
#     parser.add_argument('--csv', action='store_true', default=False,
#                         help='output the data in CSV format.')
#     parser.add_argument('--workers', type=int, default=8,
#                         help='number of workers to use, 8 by default.')
#     return parser.parse_args()
 
 
# def show_video_stats(options):
#     #video_page_urls = get_video_page_urls()
#     #for video_page_url in video_page_urls:
#     #    print get_video_data(video_page_url)
#     pool = Pool(options.workers)
#     video_page_urls = get_video_page_urls()
#     results = sorted(pool.map(get_video_data, video_page_urls), key=lambda video: video[options.sort],
#                      reverse=True)
#     print len(results)
#     max = options.max
#     if max is None or max > len(results):
#         max = len(results)
#     if options.csv:
#         print(u'"title","speakers", "views","likes","dislikes"')
#     else:
#         print(u'Views  +1  -1 Title (Speakers)')
#     for i in range(max):
#         if options.csv:
#             print(u'"{0}","{1}",{2},{3},{4}'.format(
#                 results[i]['title'], ', '.join(results[i]['speakers']), results[i]['views'],
#                 results[i]['likes'], results[i]['dislikes']))
#         else:
#             print(u'{0:5d} {1:3d} {2:3d} {3} ({4})'.format(
#                 results[i]['views'], results[i]['likes'], results[i]['dislikes'], results[i]['title'],
#                 ', '.join(results[i]['speakers'])))
 
 
# if __name__ == '__main__':
#     show_video_stats(parse_args())


import glob
import os

for filename in glob.iglob('/Users/hpiwowar/Downloads/academia_unis/*.html'):
    print filename
    with open(filename) as f:
        text = f.read()
    soup = bs4.BeautifulSoup(text)
    # print "\n".join([",".join([filename, myli.span.text.strip().split()[0], myli.a.attrs.get('href')]) for myli in soup.select('#department_list li')])
    response = [(myli.span.text.strip().split()[0], myli.a.attrs.get('href')) for myli in soup.select('#department_list li')]
    science_parts = [a.strip() for a in """
        Departments/Bio
        Departments/Chem
        Departments/Geo
        Departments/Health
        Departments/Applied_Science
        Psychology
        Physics
        Math
        Medicine
        Engineering""".split()]
    with_science = []
    for (people, link) in response:
        edu = link.replace("https://", "").split(".")[0]
        is_science = False
        for science_part in science_parts:
            if science_part in link:
                is_science = True
        with_science.append((edu, people, str(is_science), link))
    print "\n".join([",".join([col for col in science_tuple]) for science_tuple in with_science])


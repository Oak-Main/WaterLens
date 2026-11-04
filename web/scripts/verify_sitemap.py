"""Validate Next App Router sitemap output against rendered indexable pages."""
from datetime import date, datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
REQUIRED_ROUTES = {'/', '/registry', '/contaminants', '/pws', '/methodology', '/about', '/legal'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals = []
        self.noindex = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and 'canonical' in attrs.get('rel', '').lower().split():
            self.canonicals.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('name', '').lower() in {'robots', 'googlebot'}:
            self.noindex |= 'noindex' in re.split(r'[,\s]+', attrs.get('content', '').lower())


def verify(build_dir, site_url):
    origin = re.sub(r'/$', '', site_url)
    parsed_origin = urlsplit(origin)
    require(parsed_origin.scheme in {'https', 'http'} and parsed_origin.netloc
            and not parsed_origin.path and not parsed_origin.query and not parsed_origin.fragment,
            'NEXT_PUBLIC_SITE_URL must be an absolute origin')

    def route_for(url):
        parsed = urlsplit(url)
        require((parsed.scheme, parsed.netloc) == (parsed_origin.scheme, parsed_origin.netloc),
                'unexpected origin: ' + url)
        require(not parsed.query and not parsed.fragment, 'noncanonical query or fragment: ' + url)
        return unquote(parsed.path).rstrip('/') or '/'

    app = build_dir / 'server/app'
    sitemap = ET.parse(app / 'sitemap.xml.body').getroot()
    require(sitemap.tag == NS + 'urlset', 'invalid sitemap root')
    sitemap_routes = {}
    for entry in sitemap:
        require(entry.tag == NS + 'url', 'invalid sitemap entry element')
        locs = entry.findall(NS + 'loc')
        dates = entry.findall(NS + 'lastmod')
        require(len(locs) == len(dates) == 1, 'each URL requires one loc and lastmod')
        loc = (locs[0].text or '').strip()
        lastmod = (dates[0].text or '').strip()
        require(re.fullmatch(r'\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?', lastmod),
                'lastmod must be a W3C date or timestamp: ' + loc)
        try:
            if 'T' in lastmod:
                datetime.fromisoformat(lastmod.replace('Z', '+00:00'))
            else:
                date.fromisoformat(lastmod)
        except ValueError:
            raise ValueError('invalid calendar date: ' + lastmod)
        route = route_for(loc)
        require(route not in sitemap_routes, 'duplicate sitemap route: ' + route)
        sitemap_routes[route] = loc

    manifest = json.loads((build_dir / 'prerender-manifest.json').read_text(encoding='utf-8'))
    app_paths = json.loads((build_dir / 'server/app-paths-manifest.json').read_text(encoding='utf-8'))
    handlers = {path[:-len('/route')] for path in app_paths if path.endswith('/route')}
    expected = set()
    for route in manifest['routes']:
        # App Router HTML routes do not require a Pages Router dataRoute field.
        html_path = app / ('index.html' if route == '/' else route.lstrip('/') + '.html')
        if not html_path.is_file() and route in handlers:
            continue  # XML, robots, images and other route handlers are not HTML pages.
        require(html_path.is_file(), 'missing prerendered HTML: ' + route)
        page = Page()
        page.feed(html_path.read_text(encoding='utf-8'))
        if page.noindex:
            require(route not in sitemap_routes, 'noindex page in sitemap: ' + route)
            continue
        require(len(page.canonicals) == 1, 'expected one canonical: ' + route)
        require(route_for(page.canonicals[0]) == route, 'canonical/route mismatch: ' + route)
        expected.add(route)
    require(REQUIRED_ROUTES <= expected, 'missing required static pages: ' + repr(sorted(REQUIRED_ROUTES - expected)))
    require(set(sitemap_routes) == expected,
            'route mismatch: missing=' + repr(sorted(expected - set(sitemap_routes)))
            + ', extra=' + repr(sorted(set(sitemap_routes) - expected)))
    return len(expected)


if __name__ == '__main__':
    try:
        count = verify(Path(sys.argv[1] if len(sys.argv) > 1 else '.next'),
                       os.environ.get('NEXT_PUBLIC_SITE_URL', 'https://www.taptoglass.com'))
    except (OSError, ValueError, KeyError, ET.ParseError) as error:
        raise SystemExit('Sitemap verification failed: ' + str(error))
    print(f'PASS: {count} unique canonical routes; indexable App Router HTML and sitemap agree; valid dates; no production requests')

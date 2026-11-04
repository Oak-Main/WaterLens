"""Isolated regressions for real App Router manifest shapes and failure paths."""
from pathlib import Path
import json
import os
import subprocess
import tempfile
import unittest

# Keep contract fixtures independent of the implementation under test.
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
REQUIRED_ROUTES = {'/', '/registry', '/contaminants', '/pws', '/methodology', '/about', '/legal'}

SCRIPT = Path(__file__).with_name('verify_sitemap.py')


class SitemapTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='waterlens-sitemap-')
        self.addCleanup(self.temporary.cleanup)
        self.build = Path(self.temporary.name)
        self.app = self.build / 'server/app'
        self.app.mkdir(parents=True)
        self.origin = 'https://preview.example'
        self.routes = sorted(REQUIRED_ROUTES | {'/contaminants/1005', '/pws/DEMO'})
        # Next App Router entries can omit dataRoute or explicitly set it null.
        manifest = {route: ({'dataRoute': None} if i % 2 else {}) for i, route in enumerate(self.routes)}
        manifest.update({'/sitemap.xml': {}, '/robots.txt': {}, '/pws/EMPTY': {}, '/_not-found': {}})
        (self.build / 'prerender-manifest.json').write_text(json.dumps({'routes': manifest}))
        (self.build / 'server/app-paths-manifest.json').write_text(json.dumps({
            '/sitemap.xml/route': 'app/sitemap.xml/route.js', '/robots.txt/route': 'app/robots.txt/route.js'}))
        for route in self.routes:
            self.html(route, f'<link rel="canonical" href="{self.origin}{route}">')
        self.html('/pws/EMPTY', '<meta content="follow, noindex" name="robots">')
        self.html('/_not-found', '<meta name="robots" content="noindex">')
        self.write_sitemap()

    def html(self, route, body):
        path = self.app / ('index.html' if route == '/' else route.lstrip('/') + '.html')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('<!doctype html><html><head>' + body + '</head><body>Fixture</body></html>')

    def write_sitemap(self, date='2026-11-04T10:00:00.000Z', element='url'):
        entries = ''.join(f'<{element}><loc>{self.origin}{route}</loc><lastmod>{date}</lastmod></{element}>' for route in self.routes)
        (self.app / 'sitemap.xml.body').write_text(f'<urlset xmlns="{NS[1:-1]}">{entries}</urlset>')

    def run_verifier(self):
        before = {p.relative_to(self.build): p.read_bytes() for p in self.build.rglob('*') if p.is_file()}
        result = subprocess.run(['python3', str(SCRIPT), str(self.build)], text=True, capture_output=True,
                                env=dict(os.environ, NEXT_PUBLIC_SITE_URL=self.origin + '/', PYTHONOPTIMIZE='1'))
        after = {p.relative_to(self.build): p.read_bytes() for p in self.build.rglob('*') if p.is_file()}
        self.assertEqual(before, after, 'verifier must not modify build output')
        return result

    def test_app_router_null_data_routes_and_custom_origin(self):
        result = self.run_verifier()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_noindex_page_in_sitemap_fails(self):
        self.routes.append('/pws/EMPTY')
        self.write_sitemap()
        self.assertNotEqual(self.run_verifier().returncode, 0)

    def test_duplicate_sitemap_url_fails(self):
        self.routes.append('/about')
        self.write_sitemap()
        result = self.run_verifier()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('duplicate sitemap route', result.stderr)

    def test_required_route_cannot_disappear_from_both_outputs(self):
        self.routes.remove('/about')
        self.write_sitemap()
        path = self.build / 'prerender-manifest.json'
        manifest = json.loads(path.read_text())
        del manifest['routes']['/about']
        path.write_text(json.dumps(manifest))
        (self.app / 'about.html').unlink()
        result = self.run_verifier()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('missing required static pages', result.stderr)

    def test_impossible_date_fails_under_optimization(self):
        self.write_sitemap(date='2026-02-30T00:00:00Z')
        self.assertNotEqual(self.run_verifier().returncode, 0)

    def test_lookalike_xml_element_fails(self):
        self.write_sitemap(element='noturl')
        self.assertNotEqual(self.run_verifier().returncode, 0)

    def test_wrong_canonical_fails(self):
        self.html('/about', '<link rel="canonical" href="https://wrong.example/about">')
        self.assertNotEqual(self.run_verifier().returncode, 0)

    def test_missing_sitemap_route_fails(self):
        self.routes.remove('/about')
        self.write_sitemap()
        self.assertNotEqual(self.run_verifier().returncode, 0)

    def test_missing_html_fails(self):
        (self.app / 'about.html').unlink()
        self.assertNotEqual(self.run_verifier().returncode, 0)


if __name__ == '__main__':
    unittest.main()

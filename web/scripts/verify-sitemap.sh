#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export NEXT_TELEMETRY_DISABLED=1
npm run build
if command -v python3 >/dev/null 2>&1; then PYTHON=python3; else PYTHON=python; fi
"$PYTHON" - <<'PY'
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

sitemap_path = Path('.next/server/app/sitemap.xml.body')
root = ET.parse(sitemap_path).getroot()
assert root.tag == '{http://www.sitemaps.org/schemas/sitemap/0.9}urlset', root.tag
entries = list(root)
locs = []
for entry in entries:
    values = {child.tag.rsplit('}', 1)[-1]: (child.text or '').strip() for child in entry}
    assert entry.tag.endswith('url'), entry.tag
    assert values.get('loc'), 'missing <loc>'
    assert values.get('lastmod'), f"missing <lastmod>: {values.get('loc')}"
    locs.append(values['loc'])
assert len(locs) == len(set(locs)), 'duplicate URLs in sitemap'

def route_for(loc):
    parsed = urlsplit(loc)
    assert parsed.scheme == 'https' and parsed.netloc == 'www.taptoglass.com', loc
    assert not parsed.query and not parsed.fragment, loc
    return unquote(parsed.path).rstrip('/') or '/'

routes = [route_for(loc) for loc in locs]
assert len(routes) == len(set(routes)), 'duplicate route after normalization'
manifest = json.loads(Path('.next/prerender-manifest.json').read_text(encoding='utf-8'))
expected = {
    route for route, data in manifest['routes'].items()
    if data.get('dataRoute') and route not in {'/_not-found', '/results'}
}
assert set(routes) == expected, f'route mismatch: missing={sorted(expected-set(routes))}, extra={sorted(set(routes)-expected)}'
assert len(locs) == len(expected), 'sitemap count does not match real page count'
print(f'PASS: {len(locs)} unique URLs; all {len(expected)} indexable prerendered routes matched; XML and lastmod valid; no production requests')
PY

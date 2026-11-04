#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)'; then
  SITE_VERIFY_PYTHON=python3
elif command -v python >/dev/null 2>&1 && python -c 'import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)'; then
  SITE_VERIFY_PYTHON=python
else
  echo 'verify-sitemap.sh requires Python 3.7+' >&2
  exit 1
fi
# Inspect the existing build. CI runs this after next build; never rebuild here.
exec "$SITE_VERIFY_PYTHON" scripts/verify_sitemap.py "$@"

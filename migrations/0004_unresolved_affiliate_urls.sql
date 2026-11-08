-- =============================================================================
-- Forward migration: stop seeding filter links through the redirect host that
-- did not resolve in DNS checks on 2026-11-08 (affil.waterqualitylens.com).
--
-- 0002_reference_data.sql is not edited: migrations already applied anywhere must
-- stay as they were. This migration clears those URLs instead, matching the web
-- app (web/lib/data.ts, affiliate_url null). Rows with any other affiliate_url
-- are left untouched. A paid destination is added later only after a program is
-- confirmed for this site.
-- =============================================================================
UPDATE filters
   SET affiliate_url = NULL
 WHERE affiliate_url LIKE 'https://affil.waterqualitylens.com/%';

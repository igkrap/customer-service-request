ALTER TABLE companies
    DROP COLUMN IF EXISTS license_key;

DROP INDEX IF EXISTS idx_companies_license_key;

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS license_key VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_license_key ON projects(license_key);

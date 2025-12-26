ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS license_key VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_license_key ON companies(license_key);

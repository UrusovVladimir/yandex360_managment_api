CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    organization_name VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL UNIQUE,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_organization_id ON accounts(organization_id);
CREATE INDEX idx_accounts_created_at ON accounts(created_at DESC);

CREATE TABLE api_request_history (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    operation VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_data JSONB DEFAULT '{}'::jsonb,
    response_data JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    error_message TEXT,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_history_account ON api_request_history(account_id);
CREATE INDEX idx_api_history_created ON api_request_history(created_at DESC);
CREATE INDEX idx_api_history_operation ON api_request_history(operation);
CREATE INDEX idx_api_history_status ON api_request_history(status);
CREATE INDEX idx_api_history_request_data ON api_request_history USING GIN (request_data);
CREATE INDEX idx_api_history_response_data ON api_request_history USING GIN (response_data);
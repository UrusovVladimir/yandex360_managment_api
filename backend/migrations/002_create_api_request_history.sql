CREATE TABLE api_request_history (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    operation VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_data JSONB DEFAULT '{}'::jsonb,
    response_data JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    error_message TEXT,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_api_history_account ON api_request_history(account_id);
CREATE INDEX idx_api_history_created ON api_request_history(created_at DESC);
CREATE INDEX idx_api_history_operation ON api_request_history(operation);
CREATE INDEX idx_api_history_status ON api_request_history(status);
CREATE INDEX idx_api_history_request_data ON api_request_history USING GIN (request_data);
CREATE INDEX idx_api_history_response_data ON api_request_history USING GIN (response_data);

COMMENT ON TABLE api_request_history IS 'История API запросов';
COMMENT ON COLUMN api_request_history.account_id IS 'ID аккаунта';
COMMENT ON COLUMN api_request_history.operation IS 'Тип операции';
COMMENT ON COLUMN api_request_history.endpoint IS 'Endpoint API';
COMMENT ON COLUMN api_request_history.request_data IS 'Данные запроса';
COMMENT ON COLUMN api_request_history.response_data IS 'Ответ сервера';
COMMENT ON COLUMN api_request_history.status IS 'Статус запроса';
COMMENT ON COLUMN api_request_history.error_message IS 'Сообщение об ошибке';
COMMENT ON COLUMN api_request_history.duration IS 'Длительность в ms';
COMMENT ON COLUMN api_request_history.created_at IS 'Время создания';
const historyService = require('../services/historyService');

async function saveRequest(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { account_id, operation, endpoint, status } = req.body;
    
    // Валидация обязательных полей
    if (!account_id || !operation || !endpoint || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: account_id, operation, endpoint, status'
      });
    }

    const historyId = await historyService.saveRequest(account_id, req.body);

    res.json({
      success: true,
      message: 'Request saved to history',
      historyId: historyId
    });

  } catch (error) {
    console.error('Error saving request to history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save request to history',
      error: error.message
    });
  }
}

function cleanObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item));
  }

  const cleaned = {};
  const seen = new WeakSet();

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        continue;
      }
      seen.add(value);
    }

    if (value && typeof value === 'object' && value.constructor) {
      const constructorName = value.constructor.name;
      if (['Socket', 'Server', 'ClientRequest', 'IncomingMessage', 'Pool', 'Client'].includes(constructorName)) {
        continue;
      }
    }

    if (typeof value === 'object' && value !== null && !Buffer.isBuffer(value)) {
      cleaned[key] = cleanObject(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

// Вспомогательная функция для безопасного парсинга JSON
function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

// Получить историю запросов
async function getHistory(req, res) {
  try {
    const accountId = req.params.account_id;
    const filters = req.query;

    const history = await historyService.getHistory(accountId, filters);
    
    const cleanData = history.data.map(item => ({
      id: item.id,
      account_id: item.account_id,
      operation: item.operation,
      endpoint: item.endpoint,
      status: item.status,
      error_message: item.error_message,
      duration: item.duration,
      created_at: item.created_at,
      request_data: item.request_data,
      response_data: item.response_data
    }));

    res.json({
      success: true,
      data: cleanData,
      total: history.total,
      page: history.page,
      limit: history.limit,
      pages: history.pages
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message
    });
  }
}

// Получить статистику
async function getStats(req, res) {
  try {
    if (!req || !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const accountId = req.params.account_id; // Из параметра URL
    const stats = await historyService.getStats(accountId);
    
    // Очищаем данные от циклических ссылок
    const cleanStats = cleanObject(stats);

    res.json({
      success: true,
      data: cleanStats
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
}
// Добавьте этот метод в historyController.js

// Очистить историю
async function clearHistory(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const accountId = req.params.account_id; // Из параметра URL!
    const result = await historyService.clearHistory(accountId);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} history records`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear history',
      error: error.message
    });
  }
}

// Правильный экспорт
module.exports = {
  getHistory,
  getStats,
  clearHistory,
  saveRequest
};
const { query } = require('../config/database');

const historyService = {
  // Сохранить запрос в историю
  async saveRequest(accountId, requestData) {
    try {
      console.log('💾 [HistoryService] Saving request for account:', accountId);
      console.log('📋 Request data:', JSON.stringify(requestData, null, 2));
      
      const {
        operation,
        endpoint,
        request_data,
        response_data,
        status,
        error_message,
        duration
      } = requestData;
  
      // Валидация данных перед сохранением
      if (!operation || !endpoint || !status) {
        console.error('❌ Validation failed: Missing required fields');
        throw new Error('Обязательные поля не заполнены');
      }
  
      const result = await query(
        `INSERT INTO api_request_history 
         (account_id, operation, endpoint, request_data, response_data, status, error_message, duration) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [accountId, operation, endpoint, request_data, response_data, status, error_message, duration || 0]
      );
  
      console.log('✅ [HistoryService] Save successful. ID:', result.rows[0].id);
      return result.rows[0];
  
    } catch (error) {
      console.error('❌ [HistoryService] Error saving request:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  },
  

  // Получить историю запросов
  async getHistory(accountId, filters = {}) {
    try {
      const {
        limit = 50,
        page = 1,
        operation,
        status,
        start_date,
        end_date
      } = filters;

      let whereConditions = ['account_id = $1'];
      let values = [accountId];
      let paramIndex = 2;

      if (operation) {
        whereConditions.push(`operation = $${paramIndex}`);
        values.push(operation);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }

      if (start_date) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        values.push(new Date(start_date));
        paramIndex++;
      }

      if (end_date) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        values.push(new Date(end_date));
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      const offset = (page - 1) * limit;

      // Запрос для данных
      const dataQuery = `
        SELECT * FROM api_request_history 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Запрос для общего количества
      const countQuery = `
        SELECT COUNT(*) FROM api_request_history ${whereClause}
      `;

      values.push(limit, offset);

      const [dataResult, countResult] = await Promise.all([
        query(dataQuery, values),
        query(countQuery, values.slice(0, -2)) // Исключаем limit и offset
      ]);

      return {
        data: dataResult.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      };

    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  },

  // Очистить историю
  async clearHistory(accountId) {
    try {
      const result = await query(
        'DELETE FROM api_request_history WHERE account_id = $1',
        [accountId]
      );
      
      return {
        deletedCount: result.rowCount
      };

    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  },

  // Получить статистику
  async getStats(accountId) {
    try {
      const queries = {
        total: 'SELECT COUNT(*) FROM api_request_history WHERE account_id = $1',
        byStatus: `
          SELECT status, COUNT(*) as count, AVG(duration) as avg_duration
          FROM api_request_history 
          WHERE account_id = $1 
          GROUP BY status
        `,
        lastRequest: `
          SELECT operation, endpoint, created_at 
          FROM api_request_history 
          WHERE account_id = $1 
          ORDER BY created_at DESC 
          LIMIT 1
        `,
        popularOperations: `
          SELECT operation, COUNT(*) as count
          FROM api_request_history 
          WHERE account_id = $1 
          GROUP BY operation 
          ORDER BY count DESC 
          LIMIT 5
        `
      };

      const results = await Promise.all([
        query(queries.total, [accountId]),
        query(queries.byStatus, [accountId]),
        query(queries.lastRequest, [accountId]),
        query(queries.popularOperations, [accountId])
      ]);

      return {
        total: parseInt(results[0].rows[0].count),
        byStatus: results[1].rows,
        lastRequest: results[2].rows[0] || null,
        popularOperations: results[3].rows
      };

    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};

module.exports = historyService;
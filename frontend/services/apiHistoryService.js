import { http } from '../api/http'

export const apiHistoryService = {
  async getHistory(accountId, params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString()
      // УБРАТЬ /api/ из пути - http уже добавляет API_BASE
      const url = `/history/${accountId}${queryParams ? `?${queryParams}` : ''}`
      
      const response = await http.get(url)
      // console.log('History API response:', response)
      return response
    } catch (error) {
      console.error('Failed to fetch history:', error)
      return {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
      }
    }
  },

  async getStats(accountId) {
    try {
      // УБРАТЬ /api/ из пути
      return await http.get(`/history/${accountId}/stats`)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      return {
        total: 0,
        byStatus: [],
        lastRequest: null,
        popularOperations: []
      }
    }
  },

  async clearHistory(accountId) {
    try {
      // УБРАТЬ /api/ из пути
      return await http.delete(`/history/clear/${accountId}`)
    } catch (error) {
      console.error('Failed to clear history:', error)
      throw error
    }
  },

  async saveRequest(requestData) {
    try {
      // Добавляем обязательные поля
      const dataToSend = {
        account_id: requestData.account_id, // Добавляем account_id
        operation: requestData.operation,
        endpoint: requestData.endpoint,
        status: requestData.status || 'success',
        request_data: requestData.request_data || {},
        response_data: requestData.response_data || {},
        error_message: requestData.error_message || null,
        duration: requestData.duration || 0
      };
  
      // console.log('Saving history with data:', dataToSend);
      
      const response = await http.post('/history/save', dataToSend);
      return response;
    } catch (error) {
      console.error('Failed to save request history:', error);
      throw error;
    }
  }
}
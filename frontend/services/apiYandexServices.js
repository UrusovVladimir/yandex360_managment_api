// services/apiYandexServices.js
import { http } from '../api/http'
import { YANDEX_API_ENDPOINTS, buildApiUrl } from './apiEndpoints'

export const yandexApiService = {
  async getDomainPolicies(orgId) {
    const endpoint = `/yandex/admin/${orgId}/mail/routing/policies`
    const url = buildApiUrl(endpoint)
    return http.get(url)
},
  // ==================== БЕЗОПАСНОСТЬ ====================

  async getMailRoutingPolicies(orgId) {
    const endpoint = `/yandex/admin/${orgId}/mail/routing/policies`
    const url = buildApiUrl(endpoint)
    return http.get(url)
  },

  async updateMailRoutingPolicies(orgId, rules) {
    const endpoint = `/yandex/admin/${orgId}/mail/routing/policies`
    const url = buildApiUrl(endpoint)
    return http.put(url, { rules })
  },

  // Специализированные методы для доменных политик
  async getWhitelistDomains(orgId) {
    const endpoint = `/yandex/admin/${orgId}/mail/routing/policies/whitelist`
    const url = buildApiUrl(endpoint)
    return http.get(url)
},

  async getBlacklistDomains(orgId) {
    const endpoint = `/yandex/admin/${orgId}/mail/routing/policies/blacklist`
    const url = buildApiUrl(endpoint)
    return http.get(url)
  },

  async updateDomainPolicies(orgId, rules, revision) {
    const endpoint = `/yandex/admin/${orgId}/mail/routing/policies`
    const url = buildApiUrl(endpoint)
    return http.put(url, { rules, revision })
},

  // Проверка доступности API маршрутизации
  async checkMailRoutingApi(orgId) {
    try {
      const endpoint = `/yandex/admin/${orgId}/check-mail-api`
      const url = buildApiUrl(endpoint)
      const response = await http.get(url)
      return response.available
    } catch (error) {
      console.error('Error checking mail routing API:', error)
      return false
    }
  },

// services/apiYandexServices.js

async updateDomainLists(orgId, whitelistDomains, blacklistDomains) {
  try {
    const endpoint = `/yandex/admin/${orgId}/mail/routing/policies`
    const url = buildApiUrl(endpoint)
    
    // Получаем текущие политики для revision
    const currentPolicies = await this.getDomainPolicies(orgId)
    const revision = currentPolicies.revision || 0
    
    // console.log('Sending domain lists update:', {
    //   orgId,
    //   whitelistDomains,
    //   blacklistDomains,
    //   revision
    // })
    
    // Отправляем данные в правильном формате
    const response = await http.put(url, {
      whitelistDomains: whitelistDomains.join('\n'),
      blacklistDomains: blacklistDomains.join('\n'),
      revision: revision
    })
    
    return response
    
  } catch (error) {
    console.error('Error updating domain lists:', error)
    
    // Более информативные сообщения об ошибках
    if (error.response?.status === 500) {
      throw new Error('Внутренняя ошибка Яндекс API. Попробуйте позже.')
    }
    if (error.response?.status === 403) {
      throw new Error('Недостаточно прав для управления доменными политиками.')
    }
    
    throw new Error(`Не удалось обновить доменные политики: ${error.message}`)
  }
},
  async get2FAStatus(orgId) {
    const endpoint = YANDEX_API_ENDPOINTS.SECURITY.GET_2FA_STATUS(orgId)
    const url = buildApiUrl(endpoint)
    
    try {
      const response = await http.get(url)
      // console.log('2FA status response:', response)
      
      // Обрабатываем разные форматы ответа
      if (response && typeof response === 'object') {
        return {
          enabled: response.enabled !== undefined ? response.enabled : response.isEnabled,
          enforceForAdmins: response.enforceForAdmins !== undefined ? response.enforceForAdmins : true,
          rememberDevices: response.rememberDevices !== undefined ? response.rememberDevices : true
        }
      }
      
      return { enabled: false, enforceForAdmins: true, rememberDevices: true }
      
    } catch (error) {
      console.error('Error getting 2FA status:', error)
      throw error
    }
  },
  async update2FAStatus(orgId, data) {
    const endpoint = YANDEX_API_ENDPOINTS.SECURITY.UPDATE_2FA_STATUS(orgId)
    const url = buildApiUrl(endpoint)
    return http.put(url, data)
  },
  // ==================== ПОЛЬЗОВАТЕЛИ ====================
  async getAllUsers(orgId) {
    const endpoint = YANDEX_API_ENDPOINTS.USERS.GET_ALL_USERS(orgId)
    const url = buildApiUrl(endpoint)
    return http.get(url)
  },

  async getUser(orgId, userId) {
    const endpoint = YANDEX_API_ENDPOINTS.USERS.GET_USER(orgId, userId)
    const url = buildApiUrl(endpoint)
    return http.get(url)
  },

  async createUser(orgId, userData) {
    const endpoint = YANDEX_API_ENDPOINTS.USERS.CREATE_USER(orgId)
    const url = buildApiUrl(endpoint)
    return http.post(url, userData)
  },

  async updateUser(orgId, userId, userData) {
    const endpoint = YANDEX_API_ENDPOINTS.USERS.UPDATE_USER(orgId, userId)
    const url = buildApiUrl(endpoint)
    return http.put(url, userData)
  },

  async deleteUser(orgId, userId) {
    const endpoint = YANDEX_API_ENDPOINTS.USERS.DELETE_USER(orgId, userId)
    const url = buildApiUrl(endpoint)
    return http.delete(url)
  },

  // ==================== 2FA УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ====================
  async getUser2FAStatus(orgId, userId) {
    const endpoint = YANDEX_API_ENDPOINTS.USERS.GET_USER_2FA_STATUS(orgId, userId)
    const url = buildApiUrl(endpoint)
    return http.get(url)
  },

  async enableUser2FA(orgId, userId) {
    const endpoint = YANDEX_API_ENDPOINTS.USERS.ENABLE_USER_2FA(orgId, userId)
    const url = buildApiUrl(endpoint)
    return http.post(url)
  },

  async disableUser2FA(orgId, userId) {
    const endpoint = YANDEX_API_ENDPOINTS.USERS.DISABLE_USER_2FA(orgId, userId)
    const url = buildApiUrl(endpoint)
    return http.post(url)
  },

  async bulkCheck2FA(orgId, userIds) {
    const endpoint = YANDEX_API_ENDPOINTS.SECURITY.BULK_CHECK_2FA(orgId)
    const url = buildApiUrl(endpoint)
    
    // console.log('Bulk 2FA check request:', { orgId, userIds })
    
    try {
      const response = await http.post(url, { userIds })
      // console.log('Bulk 2FA check response:', response)
      return response
    } catch (error) {
      // console.error('Error in bulk 2FA check:', error)
      throw error
    }
  },

  // ==================== СИСТЕМНЫЕ МЕТОДЫ ====================
  async checkToken(orgId) {
    const endpoint = `/yandex/directory/${orgId}/check-token`
    const url = buildApiUrl(endpoint)
    return http.get(url)
  },

  async getDepartments(orgId) {
    const endpoint = `/yandex/directory/${orgId}/departments`
    const url = buildApiUrl(endpoint)
    return http.get(url)
  },

  // ==================== НАСТРОЙКИ БЕЗОПАСНОСТИ ====================
  async getSecuritySettings(orgId) {
    const endpoint = YANDEX_API_ENDPOINTS.SECURITY.GET_SECURITY_SETTINGS(orgId)
    const url = buildApiUrl(endpoint)
    return http.get(url)
  },

  async updateSecuritySettings(orgId, settings) {
    const endpoint = YANDEX_API_ENDPOINTS.SECURITY.UPDATE_SECURITY_SETTINGS(orgId)
    const url = buildApiUrl(endpoint)
    return http.put(url, settings)
  }
}
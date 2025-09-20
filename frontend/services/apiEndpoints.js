export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050/api'

export const YANDEX_API_ENDPOINTS = {
      // Безопасность
      SECURITY: {
        GET_2FA_STATUS: (orgId) => `/yandex/security/${orgId}/2fa`,
        UPDATE_2FA_STATUS: (orgId) => `/yandex/security/${orgId}/2fa`,
        GET_SECURITY_SETTINGS: (orgId) => `/yandex/security/${orgId}/settings`,
        UPDATE_SECURITY_SETTINGS: (orgId) => `/yandex/security/${orgId}/settings`,
        BULK_CHECK_2FA: (orgId) => `/yandex/security/${orgId}/bulk-check/2fa`
      },
      
      // Пользователи
      USERS: {
        GET_ALL_USERS: (orgId) => `/yandex/directory/${orgId}/users`,
        GET_USER: (orgId, userId) => `/yandex/directory/${orgId}/users/${userId}`,
        CREATE_USER: (orgId) => `/yandex/directory/${orgId}/users`,
        UPDATE_USER: (orgId, userId) => `/yandex/directory/${orgId}/users/${userId}`,
        DELETE_USER: (orgId, userId) => `/yandex/directory/${orgId}/users/${userId}`,
        
        // 2FA управление
        GET_USER_2FA_STATUS: (orgId, userId) => `/yandex/directory/${orgId}/users/${userId}/2fa`,
        ENABLE_USER_2FA: (orgId, userId) => `/yandex/directory/${orgId}/users/${userId}/2fa/enable`,
        DISABLE_USER_2FA: (orgId, userId) => `/yandex/directory/${orgId}/users/${userId}/2fa/disable`,
      },
  
  // Система
  STATUS: {
    GET_SERVICE_STATUS: '/yandex/status/service'
  }
}

// Вспомогательная функция для построения полного URL
export const buildApiUrl = (endpoint) => {
  return `${API_BASE}${endpoint}`
}
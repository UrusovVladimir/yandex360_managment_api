// const axios = require('axios');

// class YandexProxyService {
//   constructor() {
//     this.baseURL = 'https://api360.yandex.net';
//     this.client = axios.create({
//       baseURL: this.baseURL,
//       timeout: 10000
//     });
//   }

//   async request(method, endpoint, token, data = null) {
//     try {
//       const config = {
//         method,
//         url: endpoint,
//         headers: {
//           'Authorization': `OAuth ${token}`,
//           'Content-Type': 'application/json'
//         }
//       };

//       if (data) {
//         config.data = data;
//       }

//       console.log('🔍 Yandex API Request Details:', {
//         timestamp: new Date().toISOString(),
//         method: method,
//         fullUrl: `${this.baseURL}${endpoint}`,
//         endpoint: endpoint,
//         token: `OAuth ${token.substring(0, 10)}...${token.substring(token.length - 5)}`,
//         tokenLength: token.length,
//         hasData: !!data,
//         data: data ? JSON.stringify(data).substring(0, 200) + '...' : null
//       });

//       const response = await this.client(config);
      
//       console.log('✅ Yandex API Response Success:', {
//         timestamp: new Date().toISOString(),
//         status: response.status,
//         statusText: response.statusText,
//         data: JSON.stringify(response.data).substring(0, 500) + '...'
//       });

//       return response.data;

//     } catch (error) {
//       console.error('❌ Yandex API Error Details:', {
//         timestamp: new Date().toISOString(),
//         url: error.config?.url,
//         method: error.config?.method,
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         headers: error.config?.headers,
//         requestData: error.config?.data,
//         responseData: error.response?.data,
//         errorMessage: error.message
//       });

//       let errorMessage = 'Yandex API error';
//       if (error.response) {
//         errorMessage = `Yandex API ${error.response.status} ${error.response.statusText}`;
//         if (error.response.data && typeof error.response.data === 'object') {
//           errorMessage += `: ${JSON.stringify(error.response.data)}`;
//         }
//       } else if (error.request) {
//         errorMessage = 'No response from Yandex API - network error';
//       }

//       throw new Error(errorMessage);
//     }
//   }

//   // === БЕЗОПАСНОСТЬ ===
//   async get2FAStatus(orgId, token) {
//     console.log('🛡️  Getting 2FA status for orgId:', orgId);
//     return this.request('GET', `/security/v1/org/${orgId}/domain_2fa`, token);
//   }

//   async update2FAStatus(orgId, token, data) {
//     console.log('🛡️  Updating 2FA status for orgId:', orgId);
//     return this.request('PUT', `/security/v1/org/${orgId}/domain_2fa`, token, data);
//   }

//   async getSecuritySettings(orgId, token) {
//     console.log('🛡️  Getting security settings for orgId:', orgId);
//     return this.request('GET', `/security/v1/org/${orgId}/settings`, token);
//   }

//   // === ПОЛЬЗОВАТЕЛИ ===
//   async getAllUsers(orgId, token, params = {}) {
//     console.log('👥 Getting all users for orgId:', orgId);
//     const queryParams = new URLSearchParams(params).toString();
//     const endpoint = `/directory/v1/org/${orgId}/users${queryParams ? `?${queryParams}` : ''}`;
//     return this.request('GET', endpoint, token);
//   }

//   async getUser(orgId, userId, token) {
//     console.log('👤 Getting user for orgId:', orgId, 'userId:', userId);
//     return this.request('GET', `/directory/v1/org/${orgId}/users/${userId}`, token);
//   }

//   async createUser(orgId, token, userData) {
//     console.log('➕ Creating user for orgId:', orgId);
//     return this.request('POST', `/directory/v1/org/${orgId}/users`, token, userData);
//   }

//   async updateUser(orgId, userId, token, userData) {
//     console.log('✏️  Updating user for orgId:', orgId, 'userId:', userId);
//     return this.request('PUT', `/directory/v1/org/${orgId}/users/${userId}`, token, userData);
//   }

//   async deleteUser(orgId, userId, token) {
//     console.log('🗑️  Deleting user for orgId:', orgId, 'userId:', userId);
//     return this.request('DELETE', `/directory/v1/org/${orgId}/users/${userId}`, token);
//   }

//   // === НОВЫЕ МЕТОДЫ ДЛЯ 2FA УПРАВЛЕНИЯ ===
//   async getUser2FAStatus(orgId, userId, token) {
//     console.log('🔐 Getting 2FA status for user:', userId, 'orgId:', orgId);
//     return this.request('GET', `/directory/v1/org/${orgId}/users/${userId}/2fa`, token);
//   }

//   async enableUser2FA(orgId, userId, token) {
//     console.log('✅ Enabling 2FA for user:', userId, 'orgId:', orgId);
//     return this.request('POST', `/directory/v1/org/${orgId}/users/${userId}/2fa/enable`, token);
//   }

//   async disableUser2FA(orgId, userId, token) {
//     console.log('❌ Disabling 2FA for user:', userId, 'orgId:', orgId);
//     return this.request('POST', `/directory/v1/org/${orgId}/users/${userId}/2fa/disable`, token);
//   }

//   // === ПОИСК И ФИЛЬТРАЦИЯ ===
//   async searchUsers(orgId, token, searchParams = {}) {
//     console.log('🔍 Searching users for orgId:', orgId, 'params:', searchParams);
//     const queryParams = new URLSearchParams(searchParams).toString();
//     const endpoint = `/directory/v1/org/${orgId}/users${queryParams ? `?${queryParams}` : ''}`;
//     return this.request('GET', endpoint, token);
//   }

//   async getUsersByDepartment(orgId, token, departmentId) {
//     console.log('🏢 Getting users by department:', departmentId, 'orgId:', orgId);
//     return this.request('GET', `/directory/v1/org/${orgId}/users?departmentId=${departmentId}`, token);
//   }

//   // === ГРУППЫ И РОЛИ ===
//   async getUserGroups(orgId, userId, token) {
//     console.log('👥 Getting groups for user:', userId, 'orgId:', orgId);
//     return this.request('GET', `/directory/v1/org/${orgId}/users/${userId}/groups`, token);
//   }

//   async getUserRoles(orgId, userId, token) {
//     console.log('🎭 Getting roles for user:', userId, 'orgId:', orgId);
//     return this.request('GET', `/directory/v1/org/${orgId}/users/${userId}/roles`, token);
//   }

//   // === СТАТИСТИКА ===
//   async getOrganizationStats(orgId, token) {
//     console.log('📊 Getting organization stats for orgId:', orgId);
//     return this.request('GET', `/directory/v1/org/${orgId}/stats`, token);
//   }
// }

// module.exports = new YandexProxyService();
    const axios = require('axios');

    class Yandex360Service {
        constructor(token, orgId) {
            this.token = token;
            this.orgId = orgId;
            this.baseURL = 'https://api360.yandex.net';
        }

        async _request(method, endpoint, data = null) {
            try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                'Authorization': `OAuth ${this.token}`,
                'Content-Type': 'application/json'
                }
            };
        
            if (data) {
                config.data = data;
            }
        
            console.log('Yandex API Request:', {
                method,
                endpoint,
                data: JSON.stringify(data, null, 2)
            });
        
            const response = await axios(config);
            
            console.log('Yandex API Response:', {
                status: response.status,
                data: response.data
            });
        
            return response.data;
        
            } catch (error) {
            console.error('Yandex 360 API Error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });
            
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message;
            
            throw new Error(errorMessage);
            }
        }

        // === ПОЛЬЗОВАТЕЛИ ===
        async getUsers(params = {}) {
            const queryParams = new URLSearchParams({
            perPage: params.perPage || 100, 
            page: params.page || 1,
            ...params
            }).toString();
            
            return this._request('GET', `/directory/v1/org/${this.orgId}/users${queryParams ? `?${queryParams}` : ''}`);
        }

        async getUser(userId) {
            return this._request('GET', `/directory/v1/org/${this.orgId}/users/${userId}`);
        }

        async createUser(userData) {
            console.log('Creating user with data:', userData);
            
            // Преобразуем данные в формат, который ожидает Yandex API
            const yandexUserData = {
            nickname: userData.nickname || '',
            name: {
                first: userData.name?.first || '',
                last: userData.name?.last || '',
                middle: userData.name?.middle || ''
            },
            password: userData.password,
            email: userData.email,
            isEnabled: userData.isEnabled !== undefined ? userData.isEnabled : true,
            };
        
            // Добавляем опциональные поля только если они имеют значения
            if (userData.position) {
            yandexUserData.position = userData.position;
            }
            
            if (userData.departmentId && userData.departmentId > 0) {
            yandexUserData.departmentId = userData.departmentId;
            }
            
            if (userData.about) {
            yandexUserData.about = userData.about;
            }
            
            if (userData.birthday) {
            yandexUserData.birthday = userData.birthday;
            }
        
            console.log('Formatted user data for Yandex:', yandexUserData);
            
            return this._request('POST', `/directory/v1/org/${this.orgId}/users`, yandexUserData);
        }
        async updateUser(userId, userData) {
            console.log('Updating user:', userId, userData);
            
            // Аналогичное преобразование данных как в createUser
            const yandexUserData = {
            nickname: userData.nickname || '',
            name: {
                first: userData.name?.first || '',
                last: userData.name?.last || '',
                middle: userData.name?.middle || ''
            },
            // ... остальные поля
            };
        
            // Убираем пустые поля
            Object.keys(yandexUserData).forEach(key => {
            if (yandexUserData[key] === '' || yandexUserData[key] === null) {
                delete yandexUserData[key];
            }
            });
        
            return this._request('PATCH', `/directory/v1/org/${this.orgId}/users/${userId}`, yandexUserData);
        }
        async deleteUser(userId) {
            try {
            const response = await this._request(
                'DELETE', // ← метод как строка
                `/directory/v1/org/${this.orgId}/users/${userId}` // ← endpoint
                // data не нужен для DELETE
            );
            
            return response;
            } catch (error) {
            console.error('Yandex 360 API Error (deleteUser):', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.message);
            }
        }

        // === ДЕПАРТАМЕНТЫ ===
    // services/yandex360Service.js

        async getDepartmentsFromUsers() {
            try {
            console.log('Getting departments from users data...');
            
            // Получаем всех пользователей
            const response = await this.getUsers({ perPage: 1000 });
            console.log('Users API response:', {
                type: typeof response,
                hasUsers: !!response.users,
                usersType: typeof response.users,
                responseKeys: Object.keys(response)
            });
            
            // Извлекаем users из response
            let users = [];
            if (Array.isArray(response)) {
                users = response;
            } else if (Array.isArray(response.users)) {
                users = response.users;
            } else if (response && typeof response === 'object') {
                // Пробуем найти массив пользователей в ответе
                for (const key in response) {
                if (Array.isArray(response[key])) {
                    users = response[key];
                    break;
                }
                }
            }
            
            console.log(`Found ${users.length} users for department extraction`);
            
            // Извлекаем уникальные отделы из пользователей
            const departmentsMap = new Map();
            
            users.forEach((user, index) => {
                console.log(`User ${index}:`, {
                id: user.id,
                departmentId: user.departmentId,
                department: user.department,
                name: user.name
                });
                
                if (user.departmentId) {
                const departmentName = user.department || `Отдел ${user.departmentId}`;
                departmentsMap.set(user.departmentId, {
                    id: user.departmentId,
                    name: departmentName
                });
                }
            });
            
            const departments = Array.from(departmentsMap.values());
            console.log(`Extracted ${departments.length} departments from users`);
            
            return departments;
            
            } catch (error) {
            console.error('Error getting departments from users:', error);
            return [];
            }
        }

        async getDepartments() {
            try {
            const response = await this._request(
                'GET', 
                `/directory/v1/org/${this.orgId}/departments`
            );
            
            // Убедимся, что возвращаем правильные данные
            if (response && response.departments) {
                console.log(`Found ${response.departments.length} departments`);
                return response.departments;
            } else if (Array.isArray(response)) {
                console.log(`Found ${response.length} departments (array format)`);
                return response;
            } else {
                console.log('No departments found or unexpected format:', response);
                return [];
            }
            
            } catch (error) {
            console.error('Error getting departments:', error.message);
            
            // Fallback: попробуем получить отделы через пользователей
            try {
                console.log('Trying to get departments from users...');
                const departmentsFromUsers = await this.getDepartmentsFromUsers();
                return departmentsFromUsers;
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError.message);
                return [];
            }
            }
        }

        async createDepartment(departmentData) {
            return this._request('POST', `/directory/v1/org/${this.orgId}/departments`, departmentData);
        }

        async updateDepartment(departmentId, departmentData) {
            return this._request('PATCH', `/directory/v1/org/${this.orgId}/departments/${departmentId}`, departmentData);
        }

        async deleteDepartment(departmentId) {
            return this._request('DELETE', `/directory/v1/org/${this.orgId}/departments/${departmentId}`);
        }

        // === ГРУППЫ ===
        async getGroups() {
            return this._request('GET', `/directory/v1/org/${this.orgId}/groups`);
        }

        async getGroup(groupId) {
            return this._request('GET', `/directory/v1/org/${this.orgId}/groups/${groupId}`);
        }

        async createGroup(groupData) {
            return this._request('POST', `/directory/v1/org/${this.orgId}/groups`, groupData);
        }

        // === ДОМЕНЫ ===
        async getDomains() {
            return this._request('GET', `/directory/v1/org/${this.orgId}/domains`);
        }

        // === АЛИАСЫ ===
        async getUserAliases(userId) {
            return this._request('GET', `/directory/v1/org/${this.orgId}/users/${userId}/aliases`);
        }

        async addUserAlias(userId, aliasData) {
            return this._request('POST', `/directory/v1/org/${this.orgId}/users/${userId}/aliases`, aliasData);
        }

        // В services/yandex360Service.js добавляем:
        async get2FAStatus() {
            return this._request('GET', `/security/v1/org/${this.orgId}/domain_2fa`);
        }
        
        async update2FAStatus(data) {
            return this._request('PUT', `/security/v1/org/${this.orgId}/domain_2fa`, data);
        }
        
        async getSecuritySettings() {
            try {
                return await this._request('GET', `/security/v1/org/${this.orgId}/settings`);
            } catch (error) {
                console.error('Error getting security settings:', error);
                throw new Error(`Failed to get security settings: ${error.message}`);
            }
        }
        async getUser2FAStatus(userId) {
            try {
              console.log(`Getting 2FA status for user ${userId} in org ${this.orgId}`);
              
              const response = await this._request(
                'GET',
                `/directory/v1/org/${this.orgId}/users/${userId}/2fa`
              );
              
              console.log('2FA status response:', response);
              
              // ВОЗВРАЩАЕМ СЫРОЙ ОТВЕТ ОТ API БЕЗ ПРЕОБРАЗОВАНИЙ
              return response;
              
            } catch (error) {
              console.error('Error getting user 2FA status:', error.message);
              
              if (error.response?.status === 404) {
                throw new Error('user_not_found');
              } else if (error.response?.status === 403) {
                throw new Error('no_permission');
              } else if (error.response?.status === 400) {
                throw new Error('not_org_user');
              }
              
              throw new Error(`Failed to get 2FA status: ${error.message}`);
            }
          }
        async enableUser2FA(userId) {
            try {
            console.log(`Enabling 2FA for user ${userId} in org ${this.orgId}`);
            
            const response = await this._request(
                'POST',
                `/directory/v1/org/${this.orgId}/users/${userId}/2fa/enable`
            );
            
            console.log('Enable 2FA response:', response);
            return { success: true, message: '2FA успешно включено' };
            
            } catch (error) {
            console.error('Error enabling 2FA:', error.message);
            throw new Error(`Не удалось включить 2FA: ${error.message}`);
            }
        }
        
        async disableUser2FA(userId) {
            try {
            console.log(`Disabling 2FA for user ${userId} in org ${this.orgId}`);
            
            const response = await this._request(
                'POST',
                `/directory/v1/org/${this.orgId}/users/${userId}/2fa/disable`
            );
            
            console.log('Disable 2FA response:', response);
            return { success: true, message: '2FA успешно выключено' };
            
            } catch (error) {
            console.error('Error disabling 2FA:', error.message);
            throw new Error(`Не удалось выключить 2FA: ${error.message}`);
            }
        }
        async getMailRoutingPolicies() {
            try {
                const response = await this._request(
                    'GET',
                    `/admin/v1/org/${this.orgId}/mail/routing/policies`
                );
                
                // Формат ответа: { rules: [], revision: 0 }
                return response.rules || [];
                
            } catch (error) {
                console.error('Error getting mail routing policies:', error);
                
                if (error.response?.status === 404) {
                    console.warn('Mail routing policies API not available');
                    return [];
                }
                
                throw new Error(`Failed to get mail routing policies: ${error.message}`);
            }
        }
    
        // services/yandex360Service.js

        async updateMailRoutingPolicies(rules, revision) {
            try {
              console.log('Sending rules to Yandex API:');
              console.log('Revision:', revision);
              console.log('Rules count:', rules.length);
              
              // Логируем полную структуру для отладки
              rules.forEach((rule, index) => {
                console.log(`Rule ${index + 1}:`, JSON.stringify(rule, null, 2));
              });
          
              const response = await this._request(
                'PUT',
                `/admin/v1/org/${this.orgId}/mail/routing/policies`,
                {
                  rules: rules,
                  revision: revision
                }
              );
              
              console.log('✓ Mail routing policies update successful');
              return response;
              
            } catch (error) {
              console.error('✗ Error updating mail routing policies:');
              
              // Детальный анализ ошибки
              if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Headers:', error.response.headers);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
                
                if (error.response.data && error.response.data.details) {
                  console.error('Error details:', error.response.data.details);
                }
              }
              
              // Специфичная обработка ошибок Яндекс API
              if (error.response?.data?.code === 13) {
                throw new Error('Внутренняя ошибка Яндекс API. Возможно, неверный формат правил или ограничения API.');
              }
              
              if (error.response?.status === 403) {
                throw new Error('Недостаточно прав. Проверьте OAuth scope "mail.routing.policies:manage"');
              }
              
              if (error.response?.status === 400) {
                throw new Error('Неверный запрос. Проверьте формат правил.');
              }
              
              throw new Error(`Failed to update mail routing policies: ${error.message}`);
            }
          }
    
        // Вспомогательные методы для работы с правилами
        async getWhitelistDomains() {
            try {
                const policies = await this.getDomainPolicies();
                const whitelistRule = policies.rules.find(rule => 
                    rule.action?.type === 'accept' || rule.name === 'whitelist_domains'
                );
                
                if (whitelistRule) {
                    console.log('Found whitelist rule:', JSON.stringify(whitelistRule, null, 2));
                    return whitelistRule.condition?.domain_filter?.list || [];
                }
                
                return [];
            } catch (error) {
                console.error('Error getting whitelist domains:', error);
                return [];
            }
        }
    
        async getBlacklistDomains() {
            try {
                const policies = await this.getDomainPolicies();
                const blacklistRule = policies.rules.find(rule => 
                    rule.action?.type === 'reject' || rule.name === 'blacklist_domains'
                );
                if (blacklistRule) {
                    console.log('Found blacklist rule:', JSON.stringify(blacklistRule, null, 2));
                    return blacklistRule.condition?.domain_filter?.list || [];
                }
                return [];
            } catch (error) {
                console.error('Error getting blacklist domains:', error);
                return [];
            }
        }
    
        async updateDomainPolicies(rules, revision) {
            try {
                const response = await this._request(
                    'PUT',
                    `/admin/v1/org/${this.orgId}/mail/routing/policies`,
                    { rules, revision: revision + 1 }
                );
                
                return response;
                
            } catch (error) {
                console.error('Error updating domain policies:', error);
                
                if (error.response?.status === 404) {
                    console.warn('Domain policies API not available');
                    return { success: true, message: 'Domain policies updated successfully (simulated)' };
                }
                
                throw new Error(`Failed to update domain policies: ${error.message}`);
            }
        }
    
        async checkMailRoutingApi() {
            try {
                await this.getMailRoutingPolicies();
                return true;
            } catch (error) {
                console.log('Mail routing API not available:', error.message);
                return false;
            }
        }
        async checkMailRoutingPermissions() {
            try {
              // Простой тестовый запрос для проверки прав
              const testResponse = await this._request(
                'GET',
                `/admin/v1/org/${this.orgId}/mail/routing/policies`
              );
              
              console.log('Mail routing permissions check passed');
              return true;
              
            } catch (error) {
              console.error('Mail routing permissions check failed:', error);
              
              if (error.response?.status === 403) {
                throw new Error('Недостаточно прав для управления доменными политиками. Проверьте настройки OAuth приложения.');
              }
              
              throw error;
            }
          }

        async getDomainPolicies() {
            try {
                const response = await this._request(
                    'GET',
                    `/admin/v1/org/${this.orgId}/mail/routing/policies`
                );
                // Формат ответа: { rules: [], revision: 0 }
                return response;
                
            } catch (error) {
                console.error('Error getting domain policies:', error);
                
                if (error.response?.status === 404) {
                    console.warn('Domain policies API not available');
                    return { rules: [], revision: 0 };
                }
                
                throw new Error(`Failed to get domain policies: ${error.message}`);
            }
        }

    async updateDomainLists(whitelistDomains, blacklistDomains) {
     try {
        console.log('Updating domain lists with:', {
            whitelist: whitelistDomains,
            blacklist: blacklistDomains
          });
          
          // Валидация входных данных
          if (!Array.isArray(whitelistDomains)) {
            throw new Error('whitelistDomains must be an array');
          }
          if (!Array.isArray(blacklistDomains)) {
            throw new Error('blacklistDomains must be an array');
          }
      
      // Получаем текущие политики
      const currentPolicies = await this.getMailRoutingPolicies();
      const currentRules = currentPolicies.rules || [];
      const revision = currentPolicies.revision || 0;
      
      console.log('Current revision:', revision);
      console.log('Existing rules count:', currentRules.length);
      
      // Упрощенные правила - только essentials
      const newRules = [];
      
      // Белый список
      if (whitelistDomains && whitelistDomains.length > 0) {
        newRules.push({
          name: 'whitelist',
          description: 'Разрешенные домены для приема почты',
          enabled: true,
          condition: {
            domain_filter: {
              list: whitelistDomains
            }
          },
          action: {
            type: 'accept'
          }
        });
      }
      
      // Черный список
      if (blacklistDomains && blacklistDomains.length > 0) {
        newRules.push({
          name: 'blacklist',
          description: 'Заблокированные домены',
          enabled: true,
          condition: {
            domain_filter: {
              list: blacklistDomains
            }
          },
          action: {
            type: 'reject'
          }
        });
      }
      
      // Сохраняем другие правила
      const otherRules = currentRules.filter(rule => 
        !rule.name.includes('whitelist') && !rule.name.includes('blacklist')
      );
      
      const allRules = [...newRules, ...otherRules];
      
      console.log('Total rules to send:', allRules.length);
      
      // Обновляем политики
      return await this.updateMailRoutingPolicies(allRules, revision);
      
    } catch (error) {
      console.error('Error in updateDomainLists:', error);
      throw error;
    }
    }
        async debugMailRoutingPolicies() {
    try {
      console.log('=== DEBUG: Checking current mail routing policies ===');
      
      // 1. Проверяем текущие политики
      const currentPolicies = await this.getMailRoutingPolicies();
      console.log('Current policies:', JSON.stringify(currentPolicies, null, 2));
      
      // 2. Проверяем права доступа
      try {
        await this.checkMailRoutingPermissions();
        console.log('✓ Permissions check passed');
      } catch (permError) {
        console.log('✗ Permissions error:', permError.message);
      }
      
      // 3. Делаем тестовый запрос с минимальными данными
      console.log('=== Testing with minimal rules ===');
      
      const testRules = [
        {
          name: 'test_rule',
          description: 'Test rule for debugging',
          enabled: false, // Отключаем для безопасности
          condition: {
            domain_filter: {
              list: ['example.com'] // Простой тестовый домен
            }
          },
          action: {
            type: 'accept',
            options: {
              force: 'ham'
            }
          }
        }
      ];
      
      const testResponse = await this._request(
        'PUT',
        `/admin/v1/org/${this.orgId}/mail/routing/policies`,
        {
          rules: testRules,
          revision: currentPolicies.revision || 0
        }
      );
      
      console.log('✓ Test request successful:', testResponse);
      return testResponse;
      
    } catch (error) {
      console.error('Debug failed:', error);
      
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
    }
    }




    }
    module.exports = Yandex360Service;
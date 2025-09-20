  // controllers/yandexController.js - ОБНОВЛЕННАЯ ВЕРСИЯ
  const Yandex360Service = require('../services/yandex360Service');
  const db = require('../config/database');
  const historyService = require('../services/historyService');
  const { default: axios } = require('axios');

  class YandexController {
      constructor() {
          // Привязываем контекст для всех методов
          this.getAccountByOrgId = this.getAccountByOrgId.bind(this);
          this.get2FAStatus = this.get2FAStatus.bind(this); // Добавляем
          this.update2FAStatus = this.update2FAStatus.bind(this); // Добавляем
          this.getSecuritySettings = this.getSecuritySettings.bind(this); // Добавляем
          this.getAllUsers = this.getAllUsers.bind(this);
          this.getUser = this.getUser.bind(this);
          this.createUser = this.createUser.bind(this);
          this.updateUser = this.updateUser.bind(this);
          this.deleteUser = this.deleteUser.bind(this);
          this.getDepartments = this.getDepartments.bind(this);
          this.checkTokenScopes = this.checkTokenScopes.bind(this);
          this.checkTokenValidity = this.checkTokenValidity.bind(this);
          this.checkToken = this.checkToken.bind(this);
          this._saveHistory = this._saveHistory.bind(this);
          this.getUser2FAStatus = this.getUser2FAStatus.bind(this);
          this.bulkCheck2FA = this.bulkCheck2FA.bind(this)
          this.enableUser2FA = this.enableUser2FA.bind(this)
          this.disableUser2FA = this.disableUser2FA.bind(this)
          this.getMailRoutingPolicies = this.getMailRoutingPolicies.bind(this)
          this.updateMailRoutingPolicies = this.updateMailRoutingPolicies.bind(this)
          this.getWhitelistDomains = this.getWhitelistDomains.bind(this)
          this.getBlacklistDomains = this.getBlacklistDomains.bind(this)
          this.updateDomainPolicies = this.updateDomainPolicies.bind(this)
          this.updateSecuritySettings = this.updateSecuritySettings.bind(this)
          // ... другие методы
      }

      // В YandexController.js добавляем методы безопасности
      async get2FAStatus(req, res) {
        try {
          const { orgId } = req.params;
          
          if (!req.account || !req.account.token) {
            return res.status(400).json({ error: 'Токен не найден' });
          }
          
          const yandexService = new Yandex360Service(req.account.token, orgId);
          const result = await yandexService.get2FAStatus();
          
          // await this._saveHistory(req, 'get2FAStatus', { orgId }, result);
          res.json(result);
        } catch (error) {
          console.error('Ошибка в get2FAStatus:', error);
          // await this._saveHistory(req, 'get2FAStatus', req.params, null, error.message);
          
          if (error.message.includes('401 Unauthorized')) {
            return res.status(401).json({ error: 'Неверный токен доступа' });
          }
          
          res.status(500).json({ error: error.message });
        }
      }

      async update2FAStatus(req, res) {
        try {
          const { orgId } = req.params;
          const data = req.body;
          
          const yandexService = new Yandex360Service(req.account.token, orgId);
          const result = await yandexService.update2FAStatus(data);
          
          await this._saveHistory(req, 'update2FAStatus', { orgId, data }, result);
          res.json(result);
        } catch (error) {
          console.error('Error in update2FAStatus:', error);
          await this._saveHistory(req, 'update2FAStatus', req.params, null, error.message);
          res.status(500).json({ error: error.message });
        }
      }

      async getSecuritySettings(req, res) {
        try {
          const { orgId } = req.params;
          
          const yandexService = new Yandex360Service(req.account.token, orgId);
          const result = await yandexService.getSecuritySettings();
          
          await this._saveHistory(req, 'getSecuritySettings', { orgId }, result);
          res.json(result);
        } catch (error) {
          console.error('Error in getSecuritySettings:', error);
          await this._saveHistory(req, 'getSecuritySettings', req.params, null, error.message);
          res.status(500).json({ error: error.message });
        }
      }
      async checkToken(req, res) {
        try {
          const { orgId } = req.params;
          console.log('🔐 Checking token for orgId:', orgId);
          
          const validityCheck = await this.checkTokenValidity(req.account.token, orgId);
          
          res.json(validityCheck);
          
        } catch (error) {
          console.error('Error in checkToken:', error);
          await this._saveHistory(req, 'checkToken', req.params, null, error.message);
          res.status(500).json({ 
            valid: false, 
            details: 'Ошибка при проверке токена',
            error: error.message 
          });
        }
      }
      async updateSecuritySettings(req, res) {
        try {
            const { orgId } = req.params;
            const settings = req.body;
            
            if (!req.account || !req.account.token) {
                return res.status(400).json({ error: 'Токен не найден' });
            }

            const yandexService = new Yandex360Service(req.account.token, orgId);
            const result = await yandexService.updateSecuritySettings(settings);
            
            await this._saveHistory(req, 'updateSecuritySettings', { orgId, settings }, result);
            res.json(result);
            
        } catch (error) {
            console.error('Error in updateSecuritySettings:', error);
            await this._saveHistory(req, 'updateSecuritySettings', req.params, null, error.message);
            res.status(500).json({ error: error.message });
        }
    }
  // controllers/yandexController.js
      async getAccountByOrgId(req, res, next) {
        try {
          const { orgId } = req.params;
          
          console.log('Looking for account with organization_id:', orgId);
          
          const result = await db.query(
            'SELECT * FROM accounts WHERE organization_id = $1',
            [orgId]
          );
          
          if (result.rows.length === 0) {
            console.log('Account not found for organization_id:', orgId);
            return res.status(404).json({ error: 'Account not found' });
          }
          
          const account = result.rows[0];
          console.log('Found account:', {
            id: account.id,
            organization_name: account.organization_name,
            organization_id: account.organization_id,
            token_present: !!account.token
          });
          
          // Проверим, что organization_id совпадает с ожидаемым
          if (account.organization_id !== orgId) {
            console.warn('Organization ID mismatch:', {
              expected: orgId,
              actual: account.organization_id
            });
          }
          
          req.account = account;
          next();
        } catch (error) {
          console.error('Error in getAccountByOrgId:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
      async getAllUsers(req, res) {
          try {
              const { orgId } = req.params;
              const { page, perPage, departmentId } = req.query;
              
              const yandexService = new Yandex360Service(req.account.token, orgId);
              const params = {};
              
              if (page) params.page = page;
              if (perPage) params.perPage = perPage;
              if (departmentId) params.departmentId = departmentId;
              
              const users = await yandexService.getUsers(params);
              
              await this._saveHistory(req, 'getAllUsers', { orgId, params }, users);
              res.json(users);
          } catch (error) {
              console.error('Error in getAllUsers:', error);
              await this._saveHistory(req, 'getAllUsers', req.params, null, error.message);
              res.status(500).json({ error: error.message });
          }
      }

      async getUser(req, res) {
          try {
              const { orgId, userId } = req.params;
              
              const yandexService = new Yandex360Service(req.account.token, orgId);
              const user = await yandexService.getUser(userId);
              
              await this._saveHistory(req, 'getUser', { orgId, userId }, user);
              res.json(user);
          } catch (error) {
              console.error('Error in getUser:', error);
              await this._saveHistory(req, 'getUser', req.params, null, error.message);
              res.status(500).json({ error: error.message });
          }
      }

      async createUser(req, res) {
          try {
              const { orgId } = req.params;
              const userData = req.body;
              
              const yandexService = new Yandex360Service(req.account.token, orgId);
              const newUser = await yandexService.createUser(userData);
              
              await this._saveHistory(req, 'createUser', { orgId, userData }, newUser);
              
              // Отправляем уведомление через WebSocket
              const io = req.app.get('io');
              if (io) {
                  io.emit('yandex_user_created', { orgId, user: newUser });
              }
              
              res.status(201).json(newUser);
          } catch (error) {
              console.error('Error in createUser:', error);
              await this._saveHistory(req, 'createUser', req.params, null, error.message);
              res.status(500).json({ error: error.message });
          }
      }

      async updateUser(req, res) {
          try {
              const { orgId, userId } = req.params;
              const userData = req.body;
              
              const yandexService = new Yandex360Service(req.account.token, orgId);
              const updatedUser = await yandexService.updateUser(userId, userData);
              
              await this._saveHistory(req, 'updateUser', { orgId, userId, userData }, updatedUser);
              
              // Отправляем уведомление через WebSocket
              const io = req.app.get('io');
              if (io) {
                  io.emit('yandex_user_updated', { orgId, userId, user: updatedUser });
              }
              
              res.json(updatedUser);
          } catch (error) {
              console.error('Error in updateUser:', error);
              await this._saveHistory(req, 'updateUser', req.params, null, error.message);
              res.status(500).json({ error: error.message });
          }
      }

      async deleteUser(req, res) {
        try {
          const { orgId, userId } = req.params;
          
          const yandexService = new Yandex360Service(req.account.token, orgId);
          await yandexService.deleteUser(userId); // ← просто userId
          
          await this._saveHistory(req, 'deleteUser', { orgId, userId }, { success: true });
          
          // WebSocket уведомление
          const io = req.app.get('io');
          if (io) {
            io.emit('yandex_user_deleted', { orgId, userId });
          }
          
          res.json({ message: 'User deleted successfully' });
        } catch (error) {
          console.error('Error in deleteUser:', error);
          await this._saveHistory(req, 'deleteUser', req.params, null, error.message);
          res.status(500).json({ error: error.message });
        }
      }

      async getDepartments(req, res) {
        try {
          const { orgId } = req.params;
          const yandexService = new Yandex360Service(req.account.token, orgId);
          
          console.log('Fetching departments for organization:', orgId);
          
          // Всегда используем метод который работает через пользователей
          const departments = await yandexService.getDepartments();
          
          console.log(`Returning ${departments.length} departments`);
          
          await this._saveHistory(req, 'getDepartments', { orgId }, departments);
          res.json(departments);
          
        } catch (error) {
          console.error('Error in getDepartments:', error);
          
          // В случае ошибки возвращаем пустой массив
          await this._saveHistory(req, 'getDepartments', req.params, null, error.message);
          res.json([]);
        }
      }

      async checkTokenScopes(req, res) {
        try {
          const { orgId } = req.params;
          const token = req.account.token;
          
          console.log('Checking token scopes for orgId:', orgId);
          
          // Пробуем несколько endpoints чтобы определить доступные права
          const endpointsToTest = [
            `/directory/v1/org/${orgId}/users`,
            `/directory/v1/org/${orgId}/departments`,
            `/directory/v1/org/${orgId}`,
            `/security/v1/org/${orgId}/domain_2fa`
          ];
          
          const results = {};
          
          for (const endpoint of endpointsToTest) {
            try {
              await axios.get(`https://api360.yandex.net${endpoint}`, {
                headers: { 'Authorization': `OAuth ${token}` },
                timeout: 3000
              });
              results[endpoint] = true;
            } catch (error) {
              results[endpoint] = {
                success: false,
                status: error.response?.status,
                error: error.response?.data
              };
            }
          }
          
          res.json({
            tokenValid: true,
            endpoints: results,
            details: 'Результаты проверки endpoints'
          });
          
        } catch (error) {
          console.error('Error checking token scopes:', error);
          res.status(500).json({ 
            error: 'Failed to check token scopes',
            details: error.message 
          });
        }
      }
      async checkTokenValidity(token, orgId) {
        try {
          console.log('🔍 Validating token for orgId:', orgId);
          
          // 1. Проверяем через API информации о пользователе (это всегда работает)
          const userResponse = await axios.get('https://login.yandex.ru/info', {
            headers: { 'Authorization': `OAuth ${token}` },
            params: { 'format': 'json' },
            timeout: 5000
          });
          
          // 2. Пробуем получить информацию об организации
          let has360Access = false;
          let organizationInfo = null;
          
          try {
            const orgResponse = await axios.get(
              `https://api360.yandex.net/directory/v1/org/${orgId}`,
              {
                headers: { 'Authorization': `OAuth ${token}` },
                timeout: 5000
              }
            );
            
            has360Access = true;
            organizationInfo = orgResponse.data;
            
          } catch (orgError) {
            if (orgError.response?.status === 404) {
              // endpoint не существует, но это не значит что токен невалиден
              has360Access = true;
            } else if (orgError.response?.status === 403) {
              // Нет доступа к этому API
              has360Access = false;
            } else {
              // Другая ошибка
              throw orgError;
            }
          }
          
          // 3. Пытаемся проверить доступ к отделам
          let hasDirectoryAccess = false;
          if (has360Access) {
            try {
              await axios.get(
                `https://api360.yandex.net/directory/v1/org/${orgId}/users`,
                {
                  headers: { 'Authorization': `OAuth ${token}` },
                  timeout: 3000,
                  params: { perPage: 1 } // Минимальный запрос
                }
              );
              hasDirectoryAccess = true;
            } catch (deptError) {
              // Игнорируем ошибки доступа
              hasDirectoryAccess = false;
            }
          }
          
          return {
            valid: true,
            has360Access: has360Access,
            hasDirectoryAccess: hasDirectoryAccess,
            user: userResponse.data,
            organization: organizationInfo,
            details: has360Access 
              ? (hasDirectoryAccess 
                  ? 'Токен действителен и имеет полный доступ к Яндекс.360' 
                  : 'Токен действителен, но доступ ограничен')
              : 'Токен действителен, но нет доступа к Яндекс.360'
          };
          
        } catch (error) {
          console.error('Token validation error:', error.response?.status || error.message);
          
          if (error.response?.status === 401) {
            return {
              valid: false,
              details: 'Токен недействителен или просрочен'
            };
          }
          
          return {
            valid: false,
            details: `Ошибка проверки: ${error.message}`
          };
        }
      }
      // В YandexController.js добавьте этот метод
      // async getUser2FAStatus(req, res) {
      //   try {
      //     const { orgId, userId } = req.params;
          
      //     if (!req.account || !req.account.token) {
      //       return res.status(400).json({ error: 'Токен не найден' });
      //     }
          
      //     const yandexService = new Yandex360Service(req.account.token, orgId);
      //     const result = await yandexService.getUser2FAStatus(userId);
          
      //     await this._saveHistory(req, 'getUser2FAStatus', { orgId, userId }, result);
      //     res.json(result);
          
      //   } catch (error) {
      //     console.error('Ошибка в getUser2FAStatus:', error.message);
          
      //     // Обрабатываем специфическую ошибку для неактивных пользователей
      //     if (error.message.includes('not_org_user') || error.message.includes('404')) {
      //       // Для неактивных пользователей возвращаем статус по умолчанию
      //       return res.json({
      //         enabled: false,
      //         comment: 'Пользователь неактивен, 2FA недоступно'
      //       });
      //     }
          
      //     await this._saveHistory(req, 'getUser2FAStatus', req.params, null, error.message);
          
      //     if (error.response?.status === 401) {
      //       return res.status(401).json({ error: 'Неверный токен доступа' });
      //     }
          
      //     res.status(500).json({ 
      //       error: error.message,
      //       details: 'Не удалось получить статус 2FA' 
      //     });
      //   }
      // }
      async getUser2FAStatus(req, res) {
        try {
          const { orgId, userId } = req.params;
          
          if (!req.account || !req.account.token) {
            return res.status(400).json({ error: 'Токен не найден' });
          }
          
          console.log(`Getting 2FA status for user ${userId} in organization ${orgId}`);
          
          const yandexService = new Yandex360Service(req.account.token, orgId);
          const result = await yandexService.getUser2FAStatus(userId);
          
          console.log('RAW 2FA result from service:', JSON.stringify(result, null, 2));
          console.log('Result type:', typeof result);
          
          await this._saveHistory(req, 'getUser2FAStatus', { orgId, userId }, result);
          res.json(result);
        }
          catch (error) {
                console.error('Ошибка в getUser2FAStatus:', error.message);
                
                // Обрабатываем специфическую ошибку для неактивных пользователей
                if (error.message.includes('not_org_user') || error.message.includes('404')) {
                  // Для неактивных пользователей возвращаем статус по умолчанию
                  return res.json({
                    enabled: false,
                    comment: 'Пользователь неактивен, 2FA недоступно'
                  });
                }
                
                await this._saveHistory(req, 'getUser2FAStatus', req.params, null, error.message);
                
                if (error.response?.status === 401) {
                  return res.status(401).json({ error: 'Неверный токен доступа' });
                }
                
                res.status(500).json({ 
                  error: error.message,
                  details: 'Не удалось получить статус 2FA' 
                });
              }
            }
      

            // async bulkCheck2FA(req, res) {
            //   try {
            //     const { orgId } = req.params;
            //     const { userIds } = req.body;
            //     console.log('Получен запрос на массовую проверку:', orgId, userIds);
            //     if (!req.account || !req.account.token) {
            //       return res.status(400).json({ error: 'Токен не найден' });
            //     }
            
            //     console.log(`Bulk checking 2FA for ${userIds.length} users in org ${orgId}`);
            
            //     const yandexService = new Yandex360Service(req.account.token, orgId);
            //     const results = [];
            
            //     // Упрощенная логика для избежания сложных объектов
            //     for (const userId of userIds) {
            //       try {
            //         const status = await yandexService.getUser2FAStatus(userId);
            //         results.push({
            //           userId,
            //           enabled: status.has2fa || false,
            //           hasSecurityPhone: status.hasSecurityPhone || false,
            //           isActive: true
            //         });
            //       } catch (error) {
            //         results.push({
            //           userId,
            //           enabled: false,
            //           error: error.message,
            //           isActive: false
            //         });
            //       }
            
            //       await new Promise(resolve => setTimeout(resolve, 50));
            //     }
            
            //     // Сохраняем только минимальные данные для истории
            //     const historyData = results.map(result => ({
            //       userId: result.userId,
            //       enabled: result.has2fa,
            //       hasError: !!result.error,
            //       isActive: result.isActive
            //     }));
            
            //     await this._saveHistory(req, 'bulkCheck2FA', { 
            //       orgId, 
            //       userIdCount: userIds.length 
            //     }, historyData);
            
            //     res.json(results);
            
            //   } catch (error) {
            //     console.error('Ошибка в bulkCheck2FA:', error);
                
            //     // Сохраняем только текст ошибки
            //     await this._saveHistory(req, 'bulkCheck2FA', req.params, null, error.message);
                
            //     res.status(500).json({ error: error.message });
            //   }
            // }
      // controllers/yandexController.js
      async bulkCheck2FA(req, res) {
        try {
          const { orgId } = req.params;
          const { userIds } = req.body;
          console.log('Получен запрос на массовую проверку:', orgId, userIds);
          
          if (!req.account || !req.account.token) {
            return res.status(400).json({ error: 'Токен не найден' });
          }
      
          console.log(`Bulk checking 2FA for ${userIds.length} users in org ${orgId}`);
      
          const yandexService = new Yandex360Service(req.account.token, orgId);
          const results = [];
      
          for (const userId of userIds) {
            try {
              const status = await yandexService.getUser2FAStatus(userId);
              results.push({
                userId,
                enabled: status.has2fa ?? false, // Используем has2fa из ответа API
                hasSecurityPhone: status.hasSecurityPhone ?? false,
                isActive: true
              });
            } catch (error) {
              results.push({
                userId,
                enabled: false,
                error: error.message,
                isActive: false
              });
            }
      
            await new Promise(resolve => setTimeout(resolve, 50));
          }
      
          // Формируем корректные данные для истории
          const historyData = results.map(result => ({
            userId: result.userId,
            enabled: result.enabled ?? false,
            hasError: !!result.error,
            isActive: result.isActive ?? false
          }));
      
          // Сохраняем только валидные данные
          await this._saveHistory(
            req,
            'bulkCheck2FA',
            { orgId, userIdCount: userIds.length },
            historyData
          );
      
          res.json(results);
        } 
        catch (error) {
          console.error('Ошибка в bulkCheck2FA:', error);
          
          // Форматируем ошибку для сохранения
          const errorData = {
            message: error.message,
            stack: error.stack
          };
          
          await this._saveHistory(
            req,
            'bulkCheck2FA',
            req.params,
            null,
            errorData
          );
          
          res.status(500).json({ error: error.message });
        }
      }
      
      async enableUser2FA(req, res) {
        try {
          const { orgId, userId } = req.params;
          
          if (!req.account || !req.account.token) {
            return res.status(400).json({ error: 'Токен не найден' });
          }
          
          const yandexService = new Yandex360Service(req.account.token, orgId);
          const result = await yandexService.enableUser2FA(userId);
          
          await this._saveHistory(req, 'enableUser2FA', { orgId, userId }, result);
          res.json(result);
          
        } catch (error) {
          console.error('Ошибка в enableUser2FA:', error);
          await this._saveHistory(req, 'enableUser2FA', req.params, null, error.message);
          res.status(500).json({ error: error.message });
        }
      }

      async disableUser2FA(req, res) {
        try {
          const { orgId, userId } = req.params;
          
          if (!req.account || !req.account.token) {
            return res.status(400).json({ error: 'Токен не найден' });
          }
          
          const yandexService = new Yandex360Service(req.account.token, orgId);
          const result = await yandexService.disableUser2FA(userId);
          
          await this._saveHistory(req, 'disableUser2FA', { orgId, userId }, result);
          res.json(result);
          
        } catch (error) {
          console.error('Ошибка в disableUser2FA:', error);
          await this._saveHistory(req, 'disableUser2FA', req.params, null, error.message);
          res.status(500).json({ error: error.message });
        }
      }
  // В _saveHistory
  async _saveHistory(req, operation, requestData, responseData, errorMessage = null) {
    try {
      const accountId = req.account.id; // ← Используем ID аккаунта
      
      const historyData = {
        operation,
        endpoint: req.originalUrl,
        request_data: requestData,
        response_data: responseData,
        status: errorMessage ? 'error' : 'success',
        error_message: errorMessage,
        duration: 0
      };
      
      await historyService.saveRequest(accountId, historyData);
    } catch (error) {
      console.error('Ошибка сохранения истории:', error);
    }
  }

      // Метод очистки данных
      _cleanDataForJSON(data) {
        try {
          // Удаляем функции и циклические ссылки
          return JSON.parse(JSON.stringify(data));
        } catch (error) {
          console.error('Ошибка очистки данных:', error);
          return null;
        }
      }
      
      
      // Добавьте вспомогательный метод для очистки данных
      _cleanDataForJSON(data) {
        if (data === null || data === undefined) {
          return null;
        }
        
        // Если это примитив
        if (typeof data !== 'object') {
          return data;
        }
        
        // Если это массив
        if (Array.isArray(data)) {
          return data.map(item => this._cleanDataForJSON(item));
        }
        
        // Если это объект
        const cleanObject = {};
        for (const [key, value] of Object.entries(data)) {
          // Пропускаем циклические ссылки и специальные объекты
          if (value && typeof value === 'object') {
            if (value instanceof Date) {
              cleanObject[key] = value.toISOString();
            } else if (Array.isArray(value)) {
              cleanObject[key] = this._cleanDataForJSON(value);
            } else {
              // Простые объекты
              try {
                JSON.parse(JSON.stringify(value));
                cleanObject[key] = this._cleanDataForJSON(value);
              } catch {
                // Если объект не может быть сериализован, заменяем строкой
                cleanObject[key] = '[Complex Object]';
              }
            }
          } else {
            cleanObject[key] = value;
          }
        }
        
        return cleanObject;
      }
      async getMailRoutingPolicies(req, res) {
        try {
            const { orgId } = req.params;
            
            if (!req.account || !req.account.token) {
                return res.status(400).json({ error: 'Токен не найден' });
            }

            const yandexService = new Yandex360Service(req.account.token, orgId);
            const policies = await yandexService.getMailRoutingPolicies();
            
            await this._saveHistory(req, 'getMailRoutingPolicies', { orgId }, policies);
            res.json(policies);
            
        } catch (error) {
            console.error('Error getting mail routing policies:', error);
            await this._saveHistory(req, 'getMailRoutingPolicies', req.params, null, error.message);
            res.json({ rules: [], revision: 0 }); // Возвращаем пустой ответ по умолчанию
        }
    }

    async updateMailRoutingPolicies(req, res) {
        try {
            const { orgId } = req.params;
            const { rules, revision } = req.body;
            
            if (!req.account || !req.account.token) {
                return res.status(400).json({ error: 'Токен не найден' });
            }

            const yandexService = new Yandex360Service(req.account.token, orgId);
            const result = await yandexService.updateMailRoutingPolicies(rules, revision);
            
            await this._saveHistory(req, 'updateMailRoutingPolicies', { orgId, rules, revision }, result);
            res.json(result);
            
        } catch (error) {
            console.error('Error updating mail routing policies:', error);
            await this._saveHistory(req, 'updateMailRoutingPolicies', req.params, null, error.message);
            res.status(500).json({ error: error.message });
        }
    }

    async getWhitelistDomains(req, res) {
        try {
            const { orgId } = req.params;
            
            if (!req.account || !req.account.token) {
                return res.status(400).json({ error: 'Токен не найден' });
            }

            const yandexService = new Yandex360Service(req.account.token, orgId);
            const domains = await yandexService.getWhitelistDomains();
            
            await this._saveHistory(req, 'getWhitelistDomains', { orgId }, domains);
            res.json(domains);
            
        } catch (error) {
            console.error('Error getting whitelist domains:', error);
            await this._saveHistory(req, 'getWhitelistDomains', req.params, null, error.message);
            res.json([]); // Возвращаем пустой массив по умолчанию
        }
    }

    async getBlacklistDomains(req, res) {
        try {
            const { orgId } = req.params;
            
            if (!req.account || !req.account.token) {
                return res.status(400).json({ error: 'Токен не найден' });
            }

            const yandexService = new Yandex360Service(req.account.token, orgId);
            const domains = await yandexService.getBlacklistDomains();
            
            await this._saveHistory(req, 'getBlacklistDomains', { orgId }, domains);
            res.json(domains);
            
        } catch (error) {
            console.error('Error getting blacklist domains:', error);
            await this._saveHistory(req, 'getBlacklistDomains', req.params, null, error.message);
            res.json([]); // Возвращаем пустой массив по умолчанию
        }
    }
    async getDomainPolicies(req, res) {
      try {
          const { orgId } = req.params;
          
          if (!req.account || !req.account.token) {
              return res.status(400).json({ error: 'Токен не найден' });
          }

          const yandexService = new Yandex360Service(req.account.token, orgId);
          const policies = await yandexService.getDomainPolicies();
          
          await this._saveHistory(req, 'getDomainPolicies', { orgId }, policies);
          res.json(policies);
          
      } catch (error) {
          console.error('Error getting domain policies:', error);
          await this._saveHistory(req, 'getDomainPolicies', req.params, null, error.message);
          res.status(500).json({ error: error.message });
      }
  }

  // controllers/yandexController.js

  // controllers/yandexController.js

  async updateDomainPolicies(req, res) {
    try {
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request headers:', req.headers);
      const { orgId } = req.params;
      
      // Получаем данные из тела запроса
      const { whitelistDomains = '', blacklistDomains = '' } = req.body;
      
      console.log('Received data:', {
        whitelistDomains: typeof whitelistDomains,
        blacklistDomains: typeof blacklistDomains,
        whitelistValue: whitelistDomains,
        blacklistValue: blacklistDomains
      });

      if (!req.account || !req.account.token) {
        return res.status(400).json({ error: 'Токен не найден' });
      }

      const yandexService = new Yandex360Service(req.account.token, orgId);
      
      // Проверяем права доступа
      try {
        await yandexService.checkMailRoutingPermissions();
      } catch (permError) {
        return res.status(403).json({ 
          error: 'Недостаточно прав',
          details: permError.message
        });
      }
      
      // Преобразуем строки в массивы (безопасно)
      const whitelistArray = typeof whitelistDomains === 'string' 
        ? whitelistDomains.split('\n')
            .filter(d => d && d.trim())
            .map(d => d.trim().toLowerCase())
        : Array.isArray(whitelistDomains)
        ? whitelistDomains.filter(d => d && d.trim())
        : [];
            
      const blacklistArray = typeof blacklistDomains === 'string' 
        ? blacklistDomains.split('\n')
            .filter(d => d && d.trim())
            .map(d => d.trim().toLowerCase())
        : Array.isArray(blacklistDomains)
        ? blacklistDomains.filter(d => d && d.trim())
        : [];

      console.log('Processed domains:');
      console.log('Whitelist:', whitelistArray);
      console.log('Blacklist:', blacklistArray);

      const result = await yandexService.updateDomainLists(whitelistArray, blacklistArray);
      
      await this._saveHistory(req, 'updateDomainPolicies', { 
        orgId, 
        whitelistDomains: whitelistArray,
        blacklistDomains: blacklistArray
      }, result);
      
      res.json({
        success: true,
        message: 'Доменные политики успешно обновлены',
        whitelistCount: whitelistArray.length,
        blacklistCount: blacklistArray.length,
        details: result
      });
      
    } catch (error) {
      console.error('Error updating domain policies:', error);
      
      let errorMessage = error.message;
      let statusCode = 500;
      
      if (error.message.includes('403') || error.message.includes('прав')) {
        statusCode = 403;
        errorMessage = 'Ошибка прав доступа: ' + error.message;
      } else if (error.message.includes('500') || error.message.includes('Internal error')) {
        errorMessage = 'Внутренняя ошибка Яндекс API. Проверьте формат доменных имен и повторите попытку.';
      }
      
      await this._saveHistory(req, 'updateDomainPolicies', req.params, null, errorMessage);
      res.status(statusCode).json({ error: errorMessage });
    }
  }

    async checkMailRoutingApi(req, res) {
        try {
            const { orgId } = req.params;
            
            if (!req.account || !req.account.token) {
                return res.status(400).json({ error: 'Токен не найден' });
            }

            const yandexService = new Yandex360Service(req.account.token, orgId);
            const isAvailable = await yandexService.checkMailRoutingApi();
            
            res.json({ available: isAvailable });
            
        } catch (error) {
            console.error('Error checking mail routing API:', error);
            res.json({ available: false });
        }
    }
    // ==============+!!!!!!!!!!!!!!!!!!+==============
    async debugMailRouting(req, res) {
      try {
        const { orgId } = req.params;
        
        if (!req.account || !req.account.token) {
          return res.status(400).json({ error: 'Токен не найден' });
        }
    
        const yandexService = new Yandex360Service(req.account.token, orgId);
        const result = await yandexService.debugMailRoutingPolicies();
        
        res.json({
          success: true,
          message: 'Debug completed',
          result: result
        });
        
      } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ 
          error: 'Debug failed',
          details: error.message
        });
      }
    }

  }

  module.exports = YandexController;
<template>
        <div class="api-operations">
        <Card class="mb-4 operations-main-card">
        <template #title>
            <i class="pi pi-cog mr-2"></i>
            Яндекс.360 API - {{ account.organization_name }}
            <Button 
            icon="pi pi-history" 
            label="Обновить историю" 
            @click="loadHistory"
            :loading="loadingHistory"
            class="ml-3 p-button-text p-button-sm"
            />
        </template>
        <template #content>
          <div class="grid">
            <!-- Безопасность -->
            <div class="col-12 md:col-6 lg:col-4">
              <Card class="h-full operation-card">
                <template #title>
                  <i class="pi pi-shield mr-2"></i>
                  Безопасность
                </template>
                <template #content>
                  <Button 
                    label="Настройки безопасности" 
                    icon="pi pi-cog"
                    @click="navigateToSecuritySettings"
                    class="w-full mb-2"
                  />
                  <Button 
                    label="Статус 2FA" 
                    icon="pi pi-lock"
                    @click="get2FAStatus"
                    :loading="loadingOperations.get2FAStatus"
                    class="w-full mb-2"
                  />
                  <Button 
                    label="Проверить токен" 
                    icon="pi pi-key"
                    @click="checkToken"
                    :loading="loading"
                    class="w-full"
                  />
                </template>
              </Card>
            </div>
            
            <!-- Пользователи -->
            <div class="col-12 md:col-6 lg:col-4">
              <Card class="h-full operation-card">
                <template #title>
                  <i class="pi pi-users mr-2"></i>
                  Пользователи
                </template>
                <template #content>
                  <Button 
                    label="Управление пользователями" 
                    icon="pi pi-user-plus"
                    @click="navigateToUserManagement"
                    class="w-full mb-2"
                  />  
                  <Button 
                    label="Получить пользователей" 
                    icon="pi pi-download"
                    @click="getUsers"
                    :loading="loadingOperations.getUsers"
                    class="w-full"
                  />

                </template>
              </Card>
            </div>
  
            <!-- Система -->
            <!-- <div class="col-12 md:col-6 lg:col-4">
              <Card class="h-full operation-card">
                <template #title>
                  <i class="pi pi-heart mr-2"></i>
                  Система
                </template>
                <template #content>
                  <Button 
                    label="Статус сервиса" 
                    icon="pi pi-check-circle"
                    @click=""
                    :loading="loadingOperations.checkToken"
                    class="w-full mb-2"
                  />
                  <Button 
                    label="Проверить токен" 
                    icon="pi pi-key"
                    @click="checkToken"
                    :loading="loading"
                    class="w-full"
                  />
                </template>
              </Card>
            </div> -->
  
            <!-- Статистика -->
            <div class="col-12 md:col-6 lg:col-4">
              <Card class="h-full operation-card">
                <template #title>
                  <i class="pi pi-chart-bar mr-2"></i>
                  Статистика
                </template>
                <template #content>
                  <div v-if="stats" class="stats-container">
                    <div class="stat-item">
                      <span class="stat-label">Всего запросов:</span>
                      <span class="stat-value">{{ stats.total }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Успешных:</span>
                      <span class="stat-value text-green-500">
                        {{ getStatusCount('success') }}
                      </span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Ошибок:</span>
                      <span class="stat-value text-red-500">
                        {{ getStatusCount('error') }}
                      </span>
                    </div>
                  </div>
                  <Button 
                    label="Обновить статистику" 
                    icon="pi pi-refresh"
                    @click="loadStats"
                    :loading="loadingStats"
                    class="w-full mt-3"
                  />
                </template>
              </Card>
            </div>
          </div>

        </template>
      </Card>
  
      <!-- Компонент для отображения результатов -->
      <ApiResults 
        :results="results" 
        @clearResults="clearResults"
      />
  
      <!-- Диалог создания пользователя -->
      <Dialog 
        v-model:visible="showCreateUser" 
        header="Создание пользователя"
        :style="{ width: '500px' }"
      >
        <CreateUserForm 
          v-if="showCreateUser"
          :account="account"
          @userCreated="handleUserCreated"
          @cancel="showCreateUser = false"
        />
      </Dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted,watch } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import ApiResults from './ApiResult.vue'
  import CreateUserForm from './CreateUserForm.vue'
  import { yandexApiService } from '../services/apiYandexServices'
  import { apiHistoryService } from '../services/apiHistoryService'
  import { useRouter } from 'vue-router'
  import securitySettings from './SecuritySettings.vue'

  const router = useRouter()
  const loading = ref(false)
  const props = defineProps({
    account: {
      type: Object,
      required: true
    }
  })

  const toast = useToast()
  
  const loadingOperations = reactive({
    get2FAStatus: false,
    getSecuritySettings: false,
    getUsers: false,
    checkToken: false
  })
  
  const loadingHistory = ref(false)
  const loadingStats = ref(false)
  const results = ref([])
  const showCreateUser = ref(false)
  const stats = ref(null)
  

  
  // Загрузка истории и статистики при монтировании
  onMounted(async () => {
    await loadHistory()
    await loadStats()
  })
  
  const loadHistory = async () => {
  loadingHistory.value = true;
  try {
    const response = await apiHistoryService.getHistory(props.account.id, {
      limit: 20,
      page: 1
    });
    
    // console.log('History response:', response);
    
    // Обрабатываем разные форматы ответа
    if (response && response.success !== false) {
      if (Array.isArray(response.data)) {
        results.value = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        results.value = response.data.data;
      } else if (Array.isArray(response)) {
        results.value = response;
      } else {
        results.value = [];
        console.warn('Unexpected history response format:', response);
      }
    } else {
      results.value = [];
      console.warn('History request failed:', response);
    }
    
  } catch (error) {
    console.error('Error loading history:', error);
    results.value = [];
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось загрузить историю запросов',
      life: 3000
    });
  } finally {
    loadingHistory.value = false;
  }
};
const loadStats = async () => {
  loadingStats.value = true;
  try {
    const response = await apiHistoryService.getStats(props.account.id);
    
    if (response && response.success !== false) {
      stats.value = response.data || response;
    } else {
      console.warn('Stats request failed:', response);
      stats.value = null;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    stats.value = null;
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось загрузить статистику',
      life: 3000
    });
  } finally {
    loadingStats.value = false;
  }
};
  
  const getStatusCount = (status) => {
    if (!stats.value?.byStatus) return 0
    const statusData = stats.value.byStatus.find(s => s.status === status)
    return statusData ? statusData.count : 0
  }
  
  // Реальные методы для работы с Яндекс API
  const get2FAStatus = async () => {
  loadingOperations.get2FAStatus = true;
  try {
    const response = await yandexApiService.get2FAStatus(
      props.account.organization_id,
      props.account.token
    );
    
    // Передаем response.data если response имеет структуру {data: ...}
    const responseData = response.data || response;
    
    await addResult('get2FAStatus', { 
      endpoint: `/security/v1/org/${props.account.organization_id}/domain_2fa`,
      orgId: props.account.organization_id
    }, responseData, 'success');
    
    toast.add({
      severity: 'success',
      summary: 'Статус 2FA получен',
      detail: 'Данные о двухфакторной аутентификации успешно загружены',
      life: 3000
    });
    
  } catch (error) {
    await addResult('get2FAStatus', { 
      endpoint: `/security/v1/org/${props.account.organization_id}/domain_2fa`,
      orgId: props.account.organization_id
    }, null, 'error', error.message);
    
    toast.add({
      severity: 'error',
      summary: 'Ошибка получения статуса 2FA',
      detail: error.message,
      life: 3000
    });
  } finally {
    loadingOperations.get2FAStatus = false;
  }
};
  const checkToken = async () => {
  loading.value = true;
  try {
    const result = await yandexApiService.checkToken(props.account.organization_id);
    // console.log('Token check result:', result);
    
    if (result.valid) {
      toast.add({
        severity: 'success',
        summary: 'Токен действителен',
        detail: result.details,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Токен недействителен',
        detail: result.details,
        life: 5000
      });
    }
  } catch (error) {
    console.error('Token check error:', error);
    toast.add({
      severity: 'error',
      summary: 'Ошибка проверки токена',
      detail: error.message,
      life: 5000
    });
  } finally {
    loading.value = false;
  }
};
  
  const getUsers = async () => {
  loadingOperations.getUsers = true;
  try {
    const response = await yandexApiService.getAllUsers(
      props.account.organization_id,
      props.account.token
    );
    
    const responseData = response.data || response;
    const usersCount = responseData.users?.length || responseData.length || 0;
    
    await addResult('getUsers', { 
      endpoint: `/directory/v1/org/${props.account.organization_id}/users`,
      orgId: props.account.organization_id
    }, responseData, 'success');
    
    toast.add({
      severity: 'success',
      summary: 'Пользователи получены',
      detail: `Найдено ${usersCount} пользователей`,
      life: 3000
    });
    
  } catch (error) {
    await addResult('getUsers', { 
      endpoint: `/directory/v1/org/${props.account.organization_id}/users`,
      orgId: props.account.organization_id
    }, null, 'error', error.message);
    
    toast.add({
      severity: 'error',
      summary: 'Ошибка получения пользователей',
      detail: error.message,
      life: 3000
    });
  } finally {
    loadingOperations.getUsers = false;
  }
};

const handleUserCreated = async (userData) => {
  try {
    const response = await yandexApiService.createUser(
      props.account.organization_id,
      props.account.token,
      userData
    );
    
    const responseData = response.data || response;
    
    await addResult('createUser', userData, responseData, 'success');
    showCreateUser.value = false;
    
    toast.add({
      severity: 'success',
      summary: 'Пользователь создан',
      detail: 'Пользователь успешно добавлен в Яндекс.360',
      life: 3000
    });
    
  } catch (error) {
    await addResult('createUser', userData, null, 'error', error.message);
    
    toast.add({
      severity: 'error',
      summary: 'Ошибка создания',
      detail: error.message,
      life: 3000
    });
  }
};
  
    const addResult = async (operation, requestData, responseData, status = 'success', error = null) => {
      const startTime = Date.now();
      const duration = Date.now() - startTime;

      try {
        // ✅ Сохраняем в БД (обязательные поля!)
        await apiHistoryService.saveRequest({
          account_id: props.account.id, // ← ОБЯЗАТЕЛЬНО!
          operation: operation,
          endpoint: requestData?.endpoint || '',
          request_data: requestData,
          response_data: responseData,
          status: status,
          error_message: error,
          duration: duration
        });

      } catch (saveError) {
        console.error('Failed to save result to history:', saveError);
      }

      // ✅ Добавляем в локальное состояние для отображения
      results.value.unshift({
        id: Date.now(),
        operation,
        requestData,
        responseData,
        status,
        error,
        timestamp: new Date().toISOString(),
        duration
      });

      // ✅ Обновляем статистику
      try {
        await loadStats();
      } catch (statsError) {
        console.error('Failed to reload stats:', statsError);
      }
    }
  
  
    const clearResults = async () => {
    try {
        await apiHistoryService.clearHistory(props.account.id)
        await loadHistory() // Перезагружаем историю после очистки
        
        toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'История запросов очищена',
        life: 3000
        })
    } catch (error) {
        toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось очистить историю',
        life: 3000
        })
    }
    }
  const navigateToUserManagement = () => {
       router.push(`/user-management/${props.account.id}`)
    }
  const navigateToSecuritySettings = () => {
  router.push(`/security-settings/${props.account.id}`)
    }
    // Наблюдаем за изменением аккаунта
    watch(() => props.account, (newAccount, oldAccount) => {
    if (newAccount && newAccount.id !== oldAccount?.id) {
        loadData()
    }
    })

    // Функция для загрузки всех данных
    const loadData = async () => {
    await Promise.all([loadHistory(), loadStats()])
    }

    // Функция для ручного обновления
    const refreshData = async () => {
    await loadData()
    }

    // Делаем функцию доступной для родительского компонента
    defineExpose({
    refreshData
    })

    // Загрузка истории и статистики при монтировании
    onMounted(() => {
    loadData()
    })

  </script>
  
  <style scoped>
  .api-operations {
    width: 100%;
  }
  
  :deep(.operation-card) {
    height: 100%;
    transition: transform 0.2s ease-in-out;
  }
  
  :deep(.operation-card:hover) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }
  
  :deep(.operations-main-card) {
    transition: none;
  }
  
  :deep(.operations-main-card:hover) {
    transform: none;
  }
  
  :deep(.p-button) {
    justify-content: start;
  }
  
  .stats-container {
    padding: 0.5rem 0;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--surface-border);
  }
  
  .stat-item:last-child {
    border-bottom: none;
  }
  
  .stat-label {
    font-weight: 500;
    color: var(--text-color-secondary);
  }
  
  .stat-value {
    font-weight: 600;
    font-size: 1.1rem;
  }
  </style>
<template>
    <Dialog 
      v-model:visible="visible" 
      header="Массовые операции с пользователями" 
      :style="{ width: '900px' }"
      :modal="true"
    >
      <div class="bulk-operations">
        <TabView>
          <TabPanel header="Проверка 2FA">
            <div class="tab-content">
              <p>Массовая проверка статуса двухфакторной аутентификации</p>
              
              <div class="filters mb-3">
                <Checkbox 
                  v-model="filterActive" 
                  :binary="true" 
                  inputId="filterActive"
                />
                <label for="filterActive" class="ml-2">Только активные пользователи</label>
              </div>

              <DataTable 
                :value="filteredUsers" 
                v-model:selection="selectedUsers"
                class="p-datatable-sm mb-3"
                scrollable
                scrollHeight="300px"
              >
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                <Column field="nickname" header="Логин"></Column>
                <Column field="email" header="Email"></Column>
                <Column header="Статус" headerStyle="width: 100px">
                  <template #body="{ data }">
                    <Tag 
                      :value="data.isEnabled ? 'Активен' : 'Неактивен'" 
                      :severity="data.isEnabled ? 'success' : 'danger'" 
                    />
                  </template>
                </Column>
                <Column header="2FA Статус" headerStyle="width: 120px">
                  <template #body="{ data }">
                    <div v-if="data.checkError" class="error-status">
                      <Tag icon="pi pi-exclamation-triangle" value="Ошибка" severity="danger"/>
                      <small class="error-text">{{ data.checkError }}</small>
                    </div>
                    <Tag 
                      v-else-if="data['2fa_enabled'] !== undefined"
                      :value="data['2fa_enabled'] ? 'Включено' : 'Отключено'" 
                      :severity="data['2fa_enabled'] ? 'success' : 'warning'" 
                    />
                    <span v-else class="text-color-secondary">Не проверено</span>
                  </template>
                </Column>
              </DataTable>

              <Button 
                label="Запустить проверку выбранных" 
                icon="pi pi-shield" 
                @click="runBulkCheck"
                :loading="loadingBulk"
                :disabled="selectedUsers.length === 0"
                class="w-full"
              />
            </div>
          </TabPanel>
          
          <TabPanel header="Импорт пользователей">
            <div class="tab-content">
              <p>Импорт пользователей из CSV файла</p>
              <FileUpload 
                mode="basic" 
                name="users[]" 
                :auto="true"
                :multiple="false"
                accept=".csv"
                :maxFileSize="1000000"
                chooseLabel="Выбрать CSV файл"
                @select="onFileSelect"
              />
              <small class="text-500">Поддерживается CSV с колонками: name,email,department,position</small>
            </div>
          </TabPanel>
          
          <TabPanel header="Экспорт пользователей">
            <div class="tab-content">
              <p>Экспорт списка пользователей в CSV</p>
              <Button 
                label="Экспортировать в CSV" 
                icon="pi pi-download" 
                @click="exportToCSV"
                class="w-full"
              />
            </div>
          </TabPanel>
        </TabView>

        <Divider />

        <div v-if="bulkResults" class="results">
          <h4>Результаты операции:</h4>
          <DataTable :value="bulkResults" class="p-datatable-sm">
            <Column field="user" header="Пользователь"></Column>
            <Column field="status" header="Статус">
              <template #body="{ data }">
                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>
            <Column field="message" header="Сообщение"></Column>
          </DataTable>
        </div>
      </div>

      <template #footer>
        <Button label="Закрыть" @click="visible = false" />
      </template>
    </Dialog>
  </template>

  <script setup>
  import { ref, watch, computed, onMounted } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { yandexApiService } from '../../services/apiYandexServices'
  import { exportToCsv } from '../../utils/exportUtils'
  import Checkbox from 'primevue/checkbox' // Добавляем импорт Checkbox

  const props = defineProps({
    visible: Boolean,
    account: Object,
    users: {
      type: Array,
      default: () => [] // Устанавливаем значение по умолчанию
    }
  })

  const emit = defineEmits(['update:visible', 'operations-complete', 'users-updated'])

  const toast = useToast()
  const visible = ref(props.visible)
  const loadingBulk = ref(false)
  const bulkResults = ref(null)
  const selectedUsers = ref([])
  const filterActive = ref(true)
  const allUsers = ref([]) // Инициализируем как массив

  // Загружаем пользователей при открытии диалога
  onMounted(async () => {
    if (props.users && props.users.length > 0) {
      allUsers.value = props.users
    } else if (props.account) {
      await loadUsers()
    }
  })

  const loadUsers = async () => {
  try {
    const response = await yandexApiService.getAllUsers(props.account.organization_id)
    // Извлекаем users из ответа
    allUsers.value = response.users || [] // Гарантируем, что это массив
    // console.log('Loaded users:', allUsers.value) 
  } catch (error) {
    console.error('Error loading users:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить пользователей',
      life: 3000
    })
    allUsers.value = [] // Устанавливаем пустой массив в случае ошибки
  }
}

  const filteredUsers = computed(() => {
    if (!Array.isArray(allUsers.value)) {
      return [] // Защита от не массива
    }
    if (!filterActive.value) {
      return allUsers.value
    }
    return allUsers.value.filter(user => user.isEnabled)
  })

  const runBulkCheck = async () => {
  loadingBulk.value = true
  bulkResults.value = null
  
  try {
    // Фильтруем только активных пользователей из выбранных
    const activeUserIds = selectedUsers.value
      .filter(user => user.isEnabled)
      .map(user => user.id)

    if (activeUserIds.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Нет активных пользователей',
        detail: 'Выберите активных пользователей для проверки',
        life: 3000
      })
      return
    }

    const results = await yandexApiService.bulkCheck2FA(
      props.account.organization_id,
      activeUserIds
    )

    // Обновляем статусы пользователей
    if (Array.isArray(results)) {
      results.forEach(result => {
        const user = allUsers.value.find(u => u.id === result.userId)
        if (user) {
          user['2fa_enabled'] = result.enabled
          if (result.error) {
            user.checkError = result.error
          }
        }
      })

      // Сообщаем родительскому компоненту об обновлении
      emit('users-updated', allUsers.value)

      // ОБНОВЛЕННАЯ ЧАСТЬ: Отображаем логин и ID вместо просто ID
      bulkResults.value = results.map(result => {
        const user = allUsers.value.find(u => u.id === result.userId)
        const userName = user ? `${user.nickname} (ID: ${result.userId})` : `User ${result.userId}`
        
        return {
          userId: result.userId,
          user: userName, // Теперь здесь логин и ID
          status: result.error ? 'error' : 'success',
          message: result.error || (result.enabled ? '2FA включено' : '2FA отключено')
        }
      })

      toast.add({
        severity: 'success',
        summary: 'Проверка завершена',
        detail: `Проверено ${results.length} пользователей`,
        life: 3000
      })
    }

  } catch (error) {
    console.error('Error in bulk check:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось выполнить массовую проверку',
      life: 3000
    })
  } finally {
    loadingBulk.value = false
  }
}

  const exportToCSV = async () => {
    try {
      let usersToExport = allUsers.value
      if (!Array.isArray(usersToExport) || usersToExport.length === 0) {
        usersToExport = await yandexApiService.getAllUsers(props.account.organization_id)
      }
      
      const csvData = usersToExport.map(user => ({
        Логин: user.nickname,
        Email: user.email,
        Имя: user.name?.first || '',
        Фамилия: user.name?.last || '',
        Отдел: user.department || '',
        Должность: user.position || '',
        Статус: user.enabled ? 'Активен' : 'Неактивен',
        '2FA': user['2fa_enabled'] ? 'Включено' : 'Отключено'
      }))
      
      exportToCsv(csvData, 'yandex_users_export.csv')
      
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Данные экспортированы в CSV',
        life: 3000
      })
      
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось экспортировать данные',
        life: 3000
      })
    }
  }

  const onFileSelect = (event) => {
    const file = event.files[0]
    if (file) {
      toast.add({
        severity: 'info',
        summary: 'Импорт',
        detail: 'Функция импорта в разработке',
        life: 3000
      })
    }
  }

  const getStatusSeverity = (status) => {
    const severities = {
      'success': 'success',
      'error': 'danger',
      'warning': 'warn'
    }
    return severities[status] || 'info'
  }

  watch(() => props.visible, (newVal) => {
    visible.value = newVal
    if (newVal && props.account) {
      loadUsers()
    }
  })

  watch(visible, (newVal) => {
    emit('update:visible', newVal)
    if (!newVal) {
      bulkResults.value = null
      selectedUsers.value = []
    }
  })

  watch(() => props.users, (newUsers) => {
    if (newUsers && Array.isArray(newUsers)) {
      allUsers.value = newUsers
    }
  }, { immediate: true })
  </script>

  <style scoped>
  .bulk-operations {
    padding: 1rem 0;
  }
  
  .tab-content {
    padding: 1rem;
  }
  
  .tab-content p {
    margin-bottom: 1rem;
    color: var(--text-color-secondary);
  }
  
  .results {
    margin-top: 1rem;
  }
  
  .error-status {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .error-text {
    font-size: 0.75rem;
    color: var(--red-500);
  }
  
  :deep(.p-tabview-panels) {
    padding: 0;
  }
  
  :deep(.p-fileupload) {
    width: 100%;
  }
  
  :deep(.p-datatable) {
    font-size: 0.9rem;
  }
  </style>
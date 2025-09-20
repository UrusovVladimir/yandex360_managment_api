<template>
    <div class="user-management">
      <Card>
        <template #title>
          <div class="flex align-items-center justify-content-between">
            <div class="flex align-items-center gap-3">
              <Button 
                icon="pi pi-arrow-left" 
                class="p-button-text p-button-sm"
                @click="goBackToServices"
                title="Назад к сервисам"
              />
              <div>
                <i class="pi pi-users mr-2"></i>
                Управление пользователями Yandex 360
                <Tag :value="users.length" class="ml-2" />
              </div>
            </div>
  
            <div class="flex gap-2">
              <Button 
                icon="pi pi-refresh" 
                @click="loadUsers" 
                :loading="loading"
                class="p-button-text"
                title="Обновить список"
              />
              <Button 
                label="Добавить пользователя" 
                icon="pi pi-user-plus" 
                @click="showCreateForm"
              />
              <Button 
                label="Массовые операции" 
                icon="pi pi-cog" 
                @click="showBulkOperations"
                class="p-button-secondary"
              />
            </div>
          </div>
          
          <!-- Информация об аккаунте -->
          <div v-if="account" class="account-info mt-3">
            <span class="text-sm text-600">
              Организация: <strong>{{ account.organization_name }}</strong> 
              (ID: {{ account.organization_id }})
            </span>
          </div>
        </template>
  
        <template #content>
          <div class="mb-4">
            <div class="flex gap-3 align-items-center">
              <span class="p-input-icon-left">
                <i class="pi pi-search mr-2" />
                <InputText 
                  v-model="searchTerm" 
                  placeholder="Поиск пользователей..." 
                  class="w-20rem"
                />
              </span>
              <Dropdown 
                v-model="selectedDepartment" 
                :options="departments" 
                optionLabel="name"
                placeholder="Все отделы" 
                class="w-15rem"
              />
              <Button 
                icon="pi pi-filter-slash" 
                label="Сбросить фильтры" 
                @click="resetFilters"
                class="p-button-text"
              />
            </div>
          </div>
  
          <DataTable 
            :value="filteredUsers" 
            :loading="loading"
            :paginator="true" 
            :rows="20"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Показано {first} - {last} из {totalRecords}"
          >
            <Column field="id" header="ID" :sortable="true"></Column>
            <Column field="name" header="Имя" :sortable="true">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <Avatar 
                    :label="getInitials(data)" 
                    size="normal" 
                    shape="circle" 
                    :style="{ 
                      backgroundColor: stringToColor(getUserDisplayName(data)),
                      color: 'white'
                    }"
                  />
                  <div class="user-info">
                    <div class="user-name">{{ getUserDisplayName(data) }}</div>
                    <div v-if="data.nickname && data.nickname !== getUserDisplayName(data)" 
                         class="user-nickname text-sm text-500">
                      @{{ data.nickname }}
                    </div>
                  </div>
                </div>
              </template>
            </Column>
            <Column field="email" header="Email" :sortable="true"></Column>
            <Column field="departmentId" header="ID отдела" :sortable="true">
              <template #body="{ data }">
                {{ data.departmentId || 'Не указан' }}
              </template>
            </Column>
            <Column field="nickname" header="Никнейм" :sortable="true"></Column>
            <Column field="isEnabled" header="Статус" :sortable="true">
              <template #body="{ data }">
                <Tag 
                  :value="data.isEnabled ? 'Активен' : 'Неактивен'" 
                  :severity="data.isEnabled ? 'success' : 'danger'" 
                />
              </template>
            </Column>
            <Column header="Действия" style="width: 120px">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Button 
                    icon="pi pi-eye" 
                    class="p-button-text p-button-sm"
                    @click="showUserDetails(data)"
                    title="Просмотр"
                  />
                  <Button 
                    icon="pi pi-pencil" 
                    class="p-button-text p-button-sm p-button-success"
                    @click="editUser(data)"
                    title="Редактировать"
                  />
                  <Button 
                    icon="pi pi-trash" 
                    class="p-button-text p-button-sm p-button-danger"
                    @click="confirmDelete(data)"
                    title="Удалить"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
  
      <!-- Диалоги -->
      <UserDetails 
        v-model:visible="showDetails" 
        :user="selectedUser" 
        :account="account"
        @edit-user="handleEditUserFromDetails"
      />
      
      <UserForm 
        v-model:visible="showUserForm" 
        :user="editingUser"
        :account="account"
        @user-saved="handleUserSaved"
      />
      
      <BulkOperations 
        v-model:visible="showBulkOps" 
        :account="account"
        @operations-complete="loadUsers"
      />
  
      <ConfirmDialog />
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useConfirm } from 'primevue/useconfirm'
  import { useToast } from 'primevue/usetoast'
  import { useRouter, useRoute } from 'vue-router'
  import { yandexApiService } from '../../services/apiYandexServices'
  import { useAccountsStore } from '../../stores/accounts'
  import UserDetails from './UserDetails.vue'
  import UserForm from './UserForm.vue'
  import BulkOperations from './BulkOperations.vue'
  
  const router = useRouter()
  const route = useRoute()
  const accountsStore = useAccountsStore()
  const confirm = useConfirm()
  const toast = useToast()
  const departmentsList = ref([])
  const loadingDepartments = ref(false)
  const users = ref([])
  const loading = ref(false)
  const searchTerm = ref('')
  const selectedDepartment = ref(null)
  const selectedUser = ref(null)
  const editingUser = ref(null)
  const showDetails = ref(false)
  const showUserForm = ref(false)
  const showBulkOps = ref(false)
  const account = ref(null)
  
  // Получаем accountId из параметров маршрута
  const accountId = computed(() => parseInt(route.params.accountId))
  
  // Навигация назад
  const goBackToServices = () => {
    router.push(`/api-services/${accountId.value}`)
  }
  
  // Функция для генерации цвета из строки
  const stringToColor = (str) => {
    if (!str) return '#3b82f6'
    
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ]
    
    return colors[Math.abs(hash) % colors.length]
  }
  
  // Получаем отображаемое имя пользователя
  const getUserDisplayName = (user) => {
    if (!user) return 'Неизвестно'
    
    // Если name - объект с first и last
    if (user.name && typeof user.name === 'object') {
      const { first, last, display } = user.name
      
      if (display && typeof display === 'string') {
        return display
      }
      
      if (first && last) {
        return `${first} ${last}`
      }
      
      if (first) {
        return first
      }
      
      if (last) {
        return last
      }
    }
    
    // Если name - строка
    if (typeof user.name === 'string' && user.name.trim()) {
      return user.name
    }
    
    // Никнейм
    if (user.nickname && typeof user.nickname === 'string') {
      return user.nickname
    }
    
    // Email
    if (user.email && typeof user.email === 'string') {
      return user.email
    }
    
    return 'Неизвестный пользователь'
  }
  
  // Получаем инициалы для аватара
  const getInitials = (user) => {
    if (!user) return '?'
    
    // Если есть объект name с first и last
    if (user.name && typeof user.name === 'object') {
      const { first, last } = user.name
      if (first && last) {
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
      } else if (first) {
        return first.substring(0, 2).toUpperCase()
      } else if (last) {
        return last.substring(0, 2).toUpperCase()
      }
    }
    
    // Если name - строка
    if (typeof user.name === 'string' && user.name.trim()) {
      const parts = user.name.trim().split(' ')
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
      }
      return user.name.substring(0, 2).toUpperCase()
    }
    
    // Если есть nickname
    if (user.nickname && typeof user.nickname === 'string') {
      return user.nickname.substring(0, 2).toUpperCase()
    }
    
    // Если есть email
    if (user.email && typeof user.email === 'string') {
      return user.email.substring(0, 2).toUpperCase()
    }
    
    return '??'
  }
  
   const loadAccountData = async () => {
      if (accountsStore.accounts.length === 0) {
        await accountsStore.fetchAccounts()
      }
      
      const foundAccount = accountsStore.accounts.find(acc => acc.id === accountId.value)
      if (foundAccount) {
        account.value = foundAccount
      } else {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Аккаунт не найден',
          life: 3000
        })
        router.push('/accounts')
      }
    }
    
    // Загрузка пользователей
    const loadUsers = async () => {
      if (!account.value) return
      
      loading.value = true
      try {
        const response = await yandexApiService.getAllUsers(account.value.organization_id)
        // console.log('API Response:', response) 
        // console.log('API Response structure:', JSON.stringify(response, null, 2))
        
        // Обрабатываем разные форматы ответа
        users.value = Array.isArray(response) ? response : response.users || []
        
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: `Загружено ${users.value.length} пользователей`,
          life: 3000
        })
      } catch (error) {
        console.error('Error loading users:', error)
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось загрузить пользователей',
          life: 3000
        })
      } finally {
        loading.value = false
      }
    }
    
    // Фильтрация пользователей
    const filteredUsers = computed(() => {
      let filtered = users.value
      
      if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase()
        filtered = filtered.filter(user => {
          const userName = getUserDisplayName(user).toLowerCase()
          const userEmail = (user.email || '').toLowerCase()
          const userNickname = (user.nickname || '').toLowerCase()
          
          return userName.includes(term) ||
                 userEmail.includes(term) ||
                 userNickname.includes(term)
        })
      }
      
      if (selectedDepartment.value) {
        filtered = filtered.filter(user => 
          user.departmentId === selectedDepartment.value.id,
        )
      }
      
      return filtered
    })
    
    // Получение отделов для фильтра
    const departments = computed(() => {
      const depts = new Map()
      users.value.forEach(user => {
        if (user.departmentId) {
          depts.set(user.departmentId, {
            id: user.departmentId,
            name: `Отдел ${user.departmentId}`
          })
        }
      })
      return Array.from(depts.values())
    })
    
    // Остальные методы без изменений...
    const showUserDetails = (user) => {
      selectedUser.value = user
      showDetails.value = true
    }
    
    const editUser = (user) => {
      editingUser.value = user
      showUserForm.value = true
    }
    
    const showCreateForm = () => {
      editingUser.value = null
      showUserForm.value = true
    }
    
    const showBulkOperations = () => {
      showBulkOps.value = true
    }
    
    const resetFilters = () => {
      searchTerm.value = ''
      selectedDepartment.value = null
    }
    
    const confirmDelete = (user) => {
      confirm.require({
        message: `Вы уверены, что хотите удалить пользователя ${getUserDisplayName(user)}?`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteUser(user)
      })
    }
    
    const deleteUser = async (user) => {
      try {
        await yandexApiService.deleteUser(account.value.organization_id, user.id)
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Пользователь удален',
          life: 3000
        })
        loadUsers()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось удалить пользователя',
          life: 3000
        })
      }
    }
    const loadDepartments = async () => {
    if (!account.value) return
    
    loadingDepartments.value = true
    try {
        // Предполагая, что у вас есть метод для получения отделов
        const response = await yandexApiService.getDepartments(account.value.organization_id)
        departmentsList.value = response.departments || response || []
    } catch (error) {
        console.error('Error loading departments:', error)
        toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось загрузить отделы',
        life: 3000
        })
    } finally {
        loadingDepartments.value = false
    }
    }
    const handleUserSaved = () => {
      loadUsers()
      showUserForm.value = false
    }

    const handleEditUserFromDetails = (userData) => {
        // console.log('Редактирование из деталей пользователя:', userData)
        
        // Закрываем диалог деталей
        showDetails.value = false
        
        // Открываем форму редактирования с данными пользователя
        editingUser.value = userData
        showUserForm.value = true
        
        toast.add({
            severity: 'info',
            summary: 'Редактирование',
            detail: `Редактирование пользователя ${getUserDisplayName(userData)}`,
            life: 2000
        })
    }

    // Загрузка при монтировании
    onMounted(async () => {
    await loadAccountData()
        if (account.value) {
            await Promise.all([loadUsers(), loadDepartments()])
        }
        })
  </script>
  
  <style scoped>
  .user-management {
    width: 100%;
  }
  
  .account-info {
    padding: 0.5rem 0;
    border-top: 1px solid var(--surface-border);
    margin-top: 0.5rem;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
  }
  
  .user-name {
    font-weight: 500;
  }
  
  .user-nickname {
    font-size: 0.8rem;
  }
  
  :deep(.p-datatable) {
    font-size: 0.9rem;
  }
  
  :deep(.p-datatable .p-datatable-thead > tr > th) {
    background: var(--surface-section);
    font-weight: 600;
  }
  </style>
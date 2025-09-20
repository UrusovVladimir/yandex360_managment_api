<template>
  <div class="users-container">
    <div class="flex justify-content-between align-items-center mb-4">
      <h1 class="text-3xl font-bold">Управление агентами</h1>
      <Button 
        label="Добавить агента" 
        icon="pi pi-plus" 
        @click="showCreateModal = true"
      />
    </div>

    <ProgressBar v-if="loading" mode="indeterminate" class="mb-4" />
    
    <Message v-if="error" severity="error" @close="error = null" class="mb-4">
      {{ error }}
    </Message>

    <DataTable :value="users" class="p-datatable-sm" dataKey="id">
      <Column field="id" header="ID" :sortable="true"></Column>
      <Column field="username" header="Имя пользователя" :sortable="true"></Column>
      <Column field="email" header="Email" :sortable="true"></Column>
      <Column field="role" header="Роль" :sortable="true">
        <template #body="{ data }">
          <Tag :value="data.role" :severity="getRoleSeverity(data.role)" />
        </template>
      </Column>
      
      <!-- <Column field="is_admin" header="Админ" :sortable="true">
        <template #body="{ data }">
          <i v-if="data.is_admin" class="pi pi-check-circle text-green-500"></i>
          <i v-else class="pi pi-times-circle text-red-500"></i>
        </template>
      </Column> -->
      
      <Column field="created_at" header="Дата создания" :sortable="true">
        <template #body="{ data }">
          {{ formatDate(data.created_at) }}
        </template>
      </Column>
      <Column header="Действия" bodyStyle="text-align:center">
        <template #body="{ data }">
          <div class="flex justify-content-center gap-2">
            <Button 
              icon="pi pi-pencil" 
              class="p-button-rounded p-button-primary p-button-text"
              @click="editUser(data)"
              title="Редактировать"
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-rounded p-button-danger p-button-text"
              @click="deleteUserHandler(data)"
              :disabled="isCurrentUser(data.id) || data.is_admin"
              :title="getDeleteButtonTitle(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <div v-if="users.length === 0 && !loading" class="empty-state">
      <i class="pi pi-users text-6xl text-400 mb-3"></i>
      <h3 class="text-2xl text-600">Агентов нет</h3>
      <p class="text-500">Добавьте первого Агента</p>
    </div>

    <!-- Модальное окно редактирования -->
    <!-- Модальное окно создания -->
    <Dialog 
  v-model:visible="showEditModal" 
  :header="'Редактирование агента ' + (editingUser?.username || '')" 
  :style="{ width: '500px' }"
  :modal="true"
  @hide="closeEditModal"
  @show="onEditModalShow"
>
  <form @submit.prevent="updateUserHandler">
    <div class="field mb-3">
      <label class="block mb-2">Имя пользователя *</label>
      <InputText 
        ref="usernameInputRef"
        v-model="editForm.username" 
        class="w-full" 
        required
        :class="{ 'p-invalid': editFormErrors.username }"
        autocomplete="username"
      />
      <small v-if="editFormErrors.username" class="p-error">{{ editFormErrors.username }}</small>
    </div>
    
    <div class="field mb-3">
      <label class="block mb-2">Email *</label>
      <InputText 
        v-model="editForm.email" 
        class="w-full" 
        type="email"
        required
        :class="{ 'p-invalid': editFormErrors.email }"
        autocomplete="email"
      />
      <small v-if="editFormErrors.email" class="p-error">{{ editFormErrors.email }}</small>
    </div>
    
    <!-- Добавляем выбор роли -->
    <div class="field mb-3">
      <label class="block mb-2">Роль *</label>
      <Dropdown 
        v-model="editForm.role" 
        :options="roleOptions" 
        optionLabel="label" 
        optionValue="value"
        placeholder="Выберите роль"
        class="w-full"
        :class="{ 'p-invalid': editFormErrors.role }"
      />
      <small v-if="editFormErrors.role" class="p-error">{{ editFormErrors.role }}</small>
    </div>
    
    <!-- Поле для смены пароля -->
    <div class="field mb-3">
  <label class="block mb-2">Новый пароль</label>
  <Password 
    v-model="editForm.password" 
    class="w-full" 
    :feedback="false"
    placeholder="Оставьте пустым, если не меняется"
    toggleMask
    :inputProps="{ autocomplete: 'new-password' }"
  />
  <small class="text-500">Оставьте пустым, если не меняется</small>
</div>
  </form>
  <template #footer>
    <Button 
      label="Отмена" 
      icon="pi pi-times" 
      @click="closeEditModal" 
      class="p-button-text"
    />
    <Button 
      label="Сохранить" 
      icon="pi pi-check" 
      @click="updateUserHandler" 
      :loading="updating"
    />
  </template>
</Dialog>

    <!-- Модальное окно создания -->
    <Dialog 
  v-model:visible="showCreateModal" 
  header="Создание пользователя" 
  :style="{ width: '500px' }"
  :modal="true"
  @hide="closeCreateModal"
  @show="onCreateModalShow"
>
  <form @submit.prevent="createUserHandler">
    <div class="field mb-3">
      <label class="block mb-2">Имя пользователя *</label>
      <InputText 
        ref="createUsernameInputRef"
        v-model="createForm.username" 
        class="w-full" 
        required
        :class="{ 'p-invalid': createFormErrors.username }"
        placeholder="Введите имя пользователя"
        autocomplete="username"
      />
      <small v-if="createFormErrors.username" class="p-error">{{ createFormErrors.username }}</small>
    </div>
    
    <div class="field mb-3">
      <label class="block mb-2">Email *</label>
      <InputText 
        v-model="createForm.email" 
        class="w-full" 
        type="email"
        required
        :class="{ 'p-invalid': createFormErrors.email }"
        placeholder="Введите email"
        autocomplete="email"
      />
      <small v-if="createFormErrors.email" class="p-error">{{ createFormErrors.email }}</small>
    </div>
    
    <!-- Добавляем выбор роли при создании -->
    <div class="field mb-3">
      <label class="block mb-2">Роль *</label>
      <Dropdown 
        v-model="createForm.role" 
        :options="roleOptions" 
        optionLabel="label" 
        optionValue="value"
        placeholder="Выберите роль"
        class="w-full"
        :class="{ 'p-invalid': createFormErrors.role }"
      />
      <small v-if="createFormErrors.role" class="p-error">{{ createFormErrors.role }}</small>
    </div>
    
    <div class="field mb-3">
    <label class="block mb-2">Пароль *</label>
    <Password 
      v-model="createForm.password" 
      class="w-full" 
      :feedback="true"
      placeholder="Введите пароль"
      toggleMask
      :inputProps="{ autocomplete: 'new-password' }"
      :class="{ 'p-invalid': createFormErrors.password }"
  />
  <small v-if="createFormErrors.password" class="p-error">{{ createFormErrors.password }}</small>
</div>
  </form>
  <template #footer>
    <Button 
      label="Отмена" 
      icon="pi pi-times" 
      @click="closeCreateModal" 
      class="p-button-text"
    />
    <Button 
      label="Создать" 
      icon="pi pi-check" 
      @click="createUserHandler" 
      :loading="creating"
    />
  </template>
</Dialog>

    <Toast />
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useUsersStore } from '../stores/users'
import { useAuthStore } from '../stores/auth' // Добавляем импорт хранилища аутентификации
import { useToast } from 'primevue/usetoast'
import { storeToRefs } from 'pinia'
import router from '../router'
import { socket } from '../socket'

const authStore = useAuthStore() 
const usersStore = useUsersStore()
const toast = useToast()

const { users, loading, error } = storeToRefs(usersStore)
const { fetchUsers, updateUser, deleteUser, createUser } = usersStore

const showEditModal = ref(false)
const showCreateModal = ref(false)
const updating = ref(false)
const creating = ref(false)
const editingUser = ref(null)
const roleOptions = ref([
  { label: 'Администратор', value: 'admin' },
  { label: 'Пользователь', value: 'user' }
])
// Refs для input fields
const usernameInputRef = ref(null)
const createUsernameInputRef = ref(null)
const isCurrentUser = (userId) => {
  return authStore.user && authStore.user.id === userId
}

const getDeleteButtonTitle = (user) => {
  if (isCurrentUser(user.id)) {
    return 'Нельзя удалить свою учетную запись'
  }
  if (user.is_admin) {
    return 'Нельзя удалить администратора'
  }
  return 'Удалить'
}

const getRoleSeverity = (role) => {
  const severities = {
    'admin': 'danger',
    'moderator': 'warning',
    'user': 'info'
  }
  return severities[role] || 'info'
}


const editForm = reactive({
  username: '',
  email: '',
  role: 'user',
  password: ''
})

const createForm = reactive({
  username: '',
  email: '',
  role: 'user',
  password: ''
})

const editFormErrors = reactive({
  username: '',
  email: '',
  role: ''
})

const createFormErrors = reactive({
  username: '',
  email: '',
  role: '',
  password: ''
})

onMounted(async () => {
  try {
    await fetchUsers()
  } catch (err) {
    showError('Не удалось загрузить пользователей')
  }
})

// Методы для фокуса
const onEditModalShow = () => {
  nextTick(() => {
    if (usernameInputRef.value) {
      usernameInputRef.value.$el.focus()
    }
  })
}

const onCreateModalShow = () => {
  nextTick(() => {
    if (createUsernameInputRef.value) {
      createUsernameInputRef.value.$el.focus()
    }
  })
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU')
}

const showError = (message) => {
  toast.add({
    severity: 'error',
    summary: 'Ошибка',
    detail: message,
    life: 3000
  })
}

const showSuccess = (message) => {
  toast.add({
    severity: 'success',
    summary: 'Успешно',
    detail: message,
    life: 3000
  })
}

const validateEditForm = () => {
  let isValid = true
  editFormErrors.username = ''
  editFormErrors.email = ''
  editFormErrors.role = ''

  if (!editForm.username.trim()) {
    editFormErrors.username = 'Имя пользователя обязательно'
    isValid = false
  }

  if (!editForm.email.trim()) {
    editFormErrors.email = 'Email обязателен'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(editForm.email)) {
    editFormErrors.email = 'Некорректный email'
    isValid = false
  }

  if (!editForm.role) {
    editFormErrors.role = 'Роль обязательна'
    isValid = false
  }

  return isValid
}

const validateCreateForm = () => {
  let isValid = true
  createFormErrors.username = ''
  createFormErrors.email = ''
  createFormErrors.role = ''
  createFormErrors.password = ''

  if (!createForm.username.trim()) {
    createFormErrors.username = 'Имя пользователя обязательно'
    isValid = false
  }

  if (!createForm.email.trim()) {
    createFormErrors.email = 'Email обязателен'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(createForm.email)) {
    createFormErrors.email = 'Некорректный email'
    isValid = false
  }

  if (!createForm.role) {
    createFormErrors.role = 'Роль обязательна'
    isValid = false
  }

  if (!createForm.password) {
    createFormErrors.password = 'Пароль обязателен'
    isValid = false
  } else if (createForm.password.length < 6) {
    createFormErrors.password = 'Пароль должен содержать минимум 6 символов'
    isValid = false
  }

  return isValid
}


const editUser = (user) => {
  editingUser.value = user
  editForm.username = user.username
  editForm.email = user.email
  editForm.role = user.role || 'user' // устанавливаем текущую роль
  editForm.password = '' // сбрасываем пароль
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  resetEditForm()
}

const resetEditForm = () => {
  editForm.username = ''
  editForm.email = ''
  editForm.role = 'user'
  editForm.password = ''
  editFormErrors.username = ''
  editFormErrors.email = ''
  editFormErrors.role = ''
}

const updateUserHandler = async () => {
    if (!validateEditForm()) return

    updating.value = true
    try {
      const usernameChanged = editForm.username !== editingUser.value.username
      
      await updateUser(editingUser.value.id, editForm)
      showEditModal.value = false
      
      // ✅ ДОБАВЬТЕ ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ДАННЫХ
      await fetchUsers() // ← Это ОБЯЗАТЕЛЬНО!
      
      if (usernameChanged) {
        showSuccess('Пользователь успешно обновлен. Требуется перезайти в систему.')
        
        if (isCurrentUser(editingUser.value.id)) {
          if (socket.connected) {
            socket.disconnect()
          }
          await authStore.logout()
          router.push('/login')
          resetEditForm()
          return
        }
      } else {
        showSuccess('Пользователь успешно обновлен')
      }
      
      resetEditForm()
      
    } catch (err) {
      showError(err.message || 'Ошибка при обновлении пользователя')
    } finally {
      updating.value = false
    }
  }

const deleteUserHandler = async (user) => {
  if (isCurrentUser(user.id)) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Нельзя удалить свою собственную учетную запись',
      life: 3000
    })
    return
  }
  
  if (user.is_admin) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Нельзя удалить учетную запись администратора',
      life: 3000
    })
    return
  }
  
  if (!confirm(`Вы уверены, что хотите удалить пользователя ${user.username}?`)) return

  try {
    await deleteUser(user.id)
    showSuccess('Пользователь успешно удален')
    
    // Принудительно обновляем данные
    await fetchUsers()
  } catch (err) {
    showError(err.message || 'Ошибка при удалении пользователя')
  }
}

const createUserHandler = async () => {
  if (!validateCreateForm()) return

  creating.value = true
  try {
    await createUser(createForm)
    showCreateModal.value = false
    showSuccess('Пользователь успешно создан')
    resetCreateForm()
    
    // ✅ ДОБАВЬТЕ ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ДАННЫХ
    await fetchUsers() // ← Это ОБЯЗАТЕЛЬНО!
    
  } catch (err) {
    showError(err.message || 'Ошибка при создании пользователя')
  } finally {
    creating.value = false
  }
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetCreateForm()
}

const resetCreateForm = () => {
  createForm.username = ''
  createForm.email = ''
  createForm.role = 'user'
  createForm.password = ''
  createFormErrors.username = ''
  createFormErrors.email = ''
  createFormErrors.role = ''
  createFormErrors.password = ''
}

</script>

<style scoped>
.users-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

:deep(.p-datatable) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.p-datatable .p-datatable-header) {
  background: var(--surface-section);
  border: none;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  transition: background-color 0.2s;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--surface-hover);
}

@media (max-width: 768px) {
  .users-container {
    padding: 1rem;
  }
  
  :deep(.p-datatable) {
    font-size: 0.9rem;
  }
  
  :deep(.p-button) {
    font-size: 0.8rem;
    padding: 0.5rem;
  }
}
</style>
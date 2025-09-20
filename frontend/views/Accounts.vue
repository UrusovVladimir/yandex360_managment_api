<template>
  <div class="accounts-container">
    <div class="flex justify-content-between align-items-center mb-4">
      <h1 class="text-3xl font-bold">Управление аккаунтами</h1>
      <Button 
        label="Добавить аккаунт" 
        icon="pi pi-plus" 
        @click="showCreateModal = true"
      />
    </div>

    <ProgressBar v-if="loading" mode="indeterminate" class="mb-4" />
    
    <Message v-if="error" severity="error" @close="error = null" class="mb-4">
      {{ error }}
      <Button 
        label="Повторить" 
        icon="pi pi-refresh" 
        @click="fetchAccounts" 
        class="p-button-text p-button-sm ml-3"
      />
    </Message>

    <DataTable :value="accounts" class="p-datatable-sm" dataKey="id">
      <Column field="id" header="ID" :sortable="true"></Column>
      <Column field="organization_name" header="Имя организации" :sortable="true"></Column>
      <Column field="organization_id" header="ID организации" :sortable="true">
        <template #body="{ data }">
          {{ data.organization_id || '-' }}
        </template>
      </Column>
      <Column field="token" header="Токен">
        <template #body="{ data }">
          <div class="flex align-items-center gap-2">
            <span>{{ showTokens[data.id] ? data.token : '••••••••' }}</span>
            <Button 
              :icon="showTokens[data.id] ? 'pi pi-eye-slash' : 'pi pi-eye'" 
              class="p-button-text p-button-sm"
              @click="toggleTokenVisibility(data.id)"
              :title="showTokens[data.id] ? 'Скрыть токен' : 'Показать токен'"
            />
          </div>
        </template>
      </Column>
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
              @click="editAccount(data)"
              title="Редактировать"
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-rounded p-button-danger p-button-text"
              @click="deleteAccountHandler(data.id)"
              title="Удалить"
            />
            <Button 
              icon="pi pi-send" 
              class="p-button-rounded p-button-success p-button-text"
              @click="navigateToApi(data.id)"
              title="Управление сервисами"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <div v-if="accounts.length === 0 && !loading" class="empty-state">
      <i class="pi pi-desktop text-6xl text-400 mb-3"></i>
      <h3 class="text-2xl text-600">Аккаунтов нет</h3>
      <p class="text-500">Добавьте первый аккаунт</p>
    </div>

    <!-- Модальное окно редактирования -->
    <Dialog 
      v-model:visible="showEditModal" 
      :header="editingAccount ? 'Редактирование аккаунта' : 'Новый аккаунт'" 
      :style="{ width: '450px' }"
      :modal="true"
      @hide="closeModal"
    >
      <form @submit.prevent="editingAccount ? updateAccountHandler() : createAccountHandler()">
        <div class="field mb-3">
          <label class="block mb-2">Имя организации</label>
          <InputText 
            ref="orgNameInputRef"
            v-model="accountForm.organization_name" 
            class="w-full" 
            required
            :class="{ 'p-invalid': formErrors.organization_name }"
            placeholder="Введите название организации"
          />
          <small v-if="formErrors.organization_name" class="p-error">{{ formErrors.organization_name }}</small>
        </div>

        <div class="field mb-3">
          <label class="block mb-2">ID организации *</label>
          <InputText 
            v-model="accountForm.organization_id" 
            class="w-full" 
            required
            :class="{ 'p-invalid': formErrors.organization_id }"
            placeholder="Введите ID организации"
          />
          <small v-if="formErrors.organization_id" class="p-error">{{ formErrors.organization_id }}</small>
        </div>

    <div class="field mb-3">
      <label class="block mb-2">Токен *</label>
      <div class="token-input-container">
        <InputText 
          v-model="accountForm.token" 
          class="w-full token-custom-input" 
          :type="showToken ? 'text' : 'password'"
          required
          :class="{ 'p-invalid': formErrors.token }"
          placeholder="Введите токен"
        />
        <i 
          :class="showToken ? 'pi pi-eye-slash' : 'pi pi-eye'" 
          class="token-eye-icon"
          @click="showToken = !showToken"
          :title="showToken ? 'Скрыть токен' : 'Показать токен'"
        />
      </div>
      <small v-if="formErrors.token" class="p-error">{{ formErrors.token }}</small>
    </div>
    
      </form>
      <template #footer>
        <Button 
          label="Отмена" 
          icon="pi pi-times" 
          @click="closeModal" 
          class="p-button-text"
        />
        <Button 
          :label="editingAccount ? 'Сохранить' : 'Создать'" 
          icon="pi pi-check" 
          @click="editingAccount ? updateAccountHandler() : createAccountHandler()" 
          :loading="processing"
        />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useAccountsStore } from '../stores/accounts'
import { useToast } from 'primevue/usetoast'
import { storeToRefs } from 'pinia'
import { socket } from '../socket'
import { useRouter } from 'vue-router'
const router = useRouter()
const navigateToApi = (accountId) => {
  router.push(`/api-services/${accountId}`)
}
const accountsStore = useAccountsStore()
const toast = useToast()

const { accounts, loading, error } = storeToRefs(accountsStore)
const { fetchAccounts, createAccount, updateAccount, deleteAccount } = accountsStore

const showEditModal = ref(false)
const showCreateModal = ref(false)
const processing = ref(false)
const editingAccount = ref(null)
const orgNameInputRef = ref(null)
const showToken = ref(false)
const showTokens = ref({}) // Для отображения токенов в таблице

const accountForm = reactive({
  organization_name: '',
  organization_id: '',
  token: ''
})

const formErrors = reactive({
  organization_name: '',
  organization_id: '',
  token: ''
})

// Socket.io обработчики событий
const setupSocketListeners = () => {
  socket.on('account_created', (newAccount) => {
    if (!accounts.value.find(acc => acc.id === newAccount.id)) {
      accounts.value.unshift(newAccount)
      showToast('success', 'Новый аккаунт', `Аккаунт ${newAccount.organization_name} создан`)
    }
  })

  socket.on('account_updated', (updatedAccount) => {
    const index = accounts.value.findIndex(acc => acc.id === updatedAccount.id)
    if (index !== -1) {
      accounts.value[index] = updatedAccount
      showToast('info', 'Аккаунт обновлен', `Аккаунт ${updatedAccount.organization_name} изменен`)
    }
  })

  socket.on('account_deleted', (deletedAccountId) => {
    accounts.value = accounts.value.filter(acc => acc.id !== deletedAccountId)
    // Удаляем из showTokens при удалении аккаунта
    if (showTokens.value[deletedAccountId]) {
      delete showTokens.value[deletedAccountId]
    }
    showToast('warn', 'Аккаунт удален', 'Аккаунт был удален')
  })
}

onMounted(() => {
  fetchAccounts()
  setupSocketListeners()
})

// Очищаем слушатели при размонтировании компонента
onUnmounted(() => {
  socket.off('account_created')
  socket.off('account_updated')
  socket.off('account_deleted')
})

const toggleTokenVisibility = (accountId) => {
  showTokens.value = {
    ...showTokens.value,
    [accountId]: !showTokens.value[accountId]
  }
}

const showToast = (severity, summary, detail) => {
  toast.add({ severity, summary, detail, life: 3000 })
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU')
}

const validateForm = () => {
  let isValid = true
  formErrors.organization_name = ''
  formErrors.organization_id = ''
  formErrors.token = ''

  // if (!accountForm.organization_name.trim()) {
  //   formErrors.organization_name = 'Имя организации обязательно'
  //   isValid = false
  // }

  if (!accountForm.organization_id.trim()) {
    formErrors.organization_id = 'ID организации обязателен'
    isValid = false
  }

  if (!accountForm.token.trim()) {
    formErrors.token = 'Токен обязателен'
    isValid = false
  }

  return isValid
}

const editAccount = (account) => {
  editingAccount.value = account
  accountForm.organization_name = account.organization_name
  accountForm.organization_id = account.organization_id
  accountForm.token = account.token
  showEditModal.value = true
  showToken.value = false // Сбрасываем видимость токена при редактировании
  
  nextTick(() => {
    if (orgNameInputRef.value) {
      orgNameInputRef.value.$el.focus()
    }
  })
}

const closeModal = () => {
  showEditModal.value = false
  editingAccount.value = null
  showToken.value = false // Сбрасываем видимость токена при закрытии
  resetForm()
}

const resetForm = () => {
  accountForm.organization_name = ''
  accountForm.organization_id = ''
  accountForm.token = ''
  formErrors.organization_name = ''
  formErrors.organization_id = ''
  formErrors.token = ''
}

const createAccountHandler = async () => {
  if (!validateForm()) return

  processing.value = true
  try {
    await createAccount(accountForm)
    showEditModal.value = false
    showToast('success', 'Успешно', 'Аккаунт успешно создан')
    resetForm()
  } catch (err) {
    showToast('error', 'Ошибка', err.message || 'Не удалось создать аккаунт')
  } finally {
    processing.value = false
  }
}

const updateAccountHandler = async () => {
  if (!validateForm()) return

  processing.value = true
  try {
    await updateAccount(editingAccount.value.id, accountForm)
    showEditModal.value = false
    showToast('success', 'Успешно', 'Аккаунт успешно обновлен')
    resetForm()
  } catch (err) {
    showToast('error', 'Ошибка', err.message || 'Не удалось обновить аккаунт')
  } finally {
    processing.value = false
  }
}

const deleteAccountHandler = async (accountId) => {
  if (!confirm('Вы уверены, что хотите удалить этот аккаунт?')) return

  try {
    await deleteAccount(accountId)
    showToast('success', 'Успешно', 'Аккаунт успешно удален')
  } catch (err) {
    showToast('error', 'Ошибка', err.message || 'Не удалось удалить аккаунт')
  }
}

// Открытие модального окна создания
watch(showCreateModal, (newVal) => {
  if (newVal) {
    editingAccount.value = null
    resetForm()
    showEditModal.value = true
    showToken.value = false // Сбрасываем видимость токена при создании
    
    nextTick(() => {
      if (orgNameInputRef.value) {
        orgNameInputRef.value.$el.focus()
      }
    })
  }
})
</script>

<style scoped>
.accounts-container {
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

:deep(.p-inputgroup .p-button) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

@media (max-width: 768px) {
  .accounts-container {
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
.token-input-group {
  border-radius: 6px;
  overflow: hidden;
}
.token-input-container {
  position: relative;
  width: 100%;
}

.token-custom-input {
  padding-right: 2.5rem !important;
  width: 100%;
}

.token-eye-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6c757d;
  z-index: 10;
}

.token-eye-icon:hover {
  color: #495057;
}
</style>
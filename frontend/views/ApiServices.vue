<template>
  <div class="api-container">
    <div class="flex justify-content-between align-items-center mb-4">
      <h1 class="text-3xl font-bold">Управление сервисами</h1>
      <Button 
        icon="pi pi-arrow-left" 
        label="Назад к аккаунтам" 
        @click="goToAccounts"
        class="p-button-text"
      />
    </div>

    <Card class="mb-4">
      <template #title>
        <i class="pi pi-user mr-2"></i>
        Выбор аккаунта
      </template>
      <template #content>
        <Dropdown 
          v-model="selectedAccount" 
          :options="accounts" 
          optionLabel="organization_name"
          placeholder="Выберите аккаунт"
          class="w-full mb-3"
          :filter="true"
          filterPlaceholder="Поиск организации"
          @change="updateRoute"
        />
        
        <div v-if="selectedAccount" class="account-info p-3 border-round surface-section">
          <p class="flex align-items-center mb-2">
            <i class="pi pi-building mr-2 text-primary"></i>
            <strong>Организация:</strong> 
            <span class="ml-2">{{ selectedAccount.organization_name }}</span>
          </p>
          <p class="flex align-items-center mb-2">
            <i class="pi pi-id-card mr-2 text-primary"></i>
            <strong>ID организации:</strong> 
            <span class="ml-2">{{ selectedAccount.organization_id }}</span>
          </p>
          <p class="flex align-items-center">
            <i class="pi pi-key mr-2 text-primary"></i>
            <strong>Токен:</strong> 
            <span class="ml-2">{{ maskedToken }}</span>
            <Button 
              :icon="showToken ? 'pi pi-eye-slash' : 'pi pi-eye'" 
              class="p-button-text p-button-sm ml-2"
              @click="showToken = !showToken"
              :title="showToken ? 'Скрыть токен' : 'Показать токен'"
            />
          </p>
        </div>

        <div v-else class="p-3 text-center text-500 border-round surface-ground">
          <i class="pi pi-info-circle mr-2"></i>
          Выберите аккаунт для работы с API
        </div>
      </template>
    </Card>

    <div v-if="selectedAccount">
      <!-- Добавляем ref к компоненту -->
      <ApiOperations ref="operationsRef" :account="selectedAccount" />
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-send text-6xl text-400 mb-3"></i>
      <h3 class="text-2xl text-600">Аккаунт не выбран</h3>
      <p class="text-500">Выберите аккаунт из списка для работы с API</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAccountsStore } from '../stores/accounts'
import { storeToRefs } from 'pinia'
import ApiOperations from '../components/ApiOperations.vue'

const router = useRouter()
const route = useRoute()
const accountsStore = useAccountsStore()
const { accounts, loading } = storeToRefs(accountsStore)
const { fetchAccounts } = accountsStore
const operationsRef = ref(null)
const selectedAccount = ref(null)
const showToken = ref(false)

const maskedToken = computed(() => {
  if (!selectedAccount.value?.token) return '—'
  return showToken.value 
    ? selectedAccount.value.token 
    : '•'.repeat(Math.min(selectedAccount.value.token.length, 12))
})

// Навигация
const goToAccounts = () => {
  router.push('/accounts')
}

const updateRoute = () => {
  if (selectedAccount.value) {
    router.push({
      path: `/api-services/${selectedAccount.value.id}`,
      query: { ...route.query }
    })
  } else {
    router.push('/api-services')
  }
}

// Загрузка данных
onMounted(async () => {
  if (accounts.value.length === 0) {
    await fetchAccounts()
  }

  // Если в URL есть accountId, выбираем соответствующий аккаунт
  if (route.params.accountId) {
    const accountId = parseInt(route.params.accountId)
    const account = accounts.value.find(acc => acc.id === accountId)
    if (account) {
      selectedAccount.value = account
    }
  }
})

// Следим за изменениями параметров маршрута
watch(() => route.params.accountId, (newAccountId) => {
  if (newAccountId) {
    const accountId = parseInt(newAccountId)
    const account = accounts.value.find(acc => acc.id === accountId)
    if (account && (!selectedAccount.value || selectedAccount.value.id !== accountId)) {
      selectedAccount.value = account
    }
  } else {
    selectedAccount.value = null
  }
})

// Следим за изменениями списка аккаунтов
watch(accounts, (newAccounts) => {
  if (route.params.accountId && newAccounts.length > 0) {
    const accountId = parseInt(route.params.accountId)
    const account = newAccounts.find(acc => acc.id === accountId)
    if (account) {
      selectedAccount.value = account
    }
  }
})
</script>

<style scoped>
.api-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.account-info {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
}

:deep(.p-card) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

:deep(.p-card .p-card-title) {
  color: var(--text-color);
  font-size: 1.25rem;
  font-weight: 600;
}

:deep(.p-card .p-card-content) {
  padding: 1.5rem;
}

:deep(.p-dropdown) {
  width: 100%;
}

:deep(.p-dropdown .p-dropdown-label) {
  padding: 0.75rem;
}

@media (max-width: 768px) {
  .api-container {
    padding: 1rem;
  }
  
  :deep(.p-card .p-card-content) {
    padding: 1rem;
  }
  
  :deep(.p-dropdown .p-dropdown-label) {
    padding: 0.5rem;
  }
}
</style>
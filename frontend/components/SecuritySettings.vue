<template>
  <div class="security-settings-page">
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
              <i class="pi pi-shield mr-2"></i>
              Настройки безопасности Yandex 360
            </div>
          </div>

          <div class="flex gap-2">
            <Button 
              icon="pi pi-refresh" 
              @click="loadSettings" 
              :loading="loading"
              class="p-button-text"
              title="Обновить настройки"
            />
            <Button 
              label="Сохранить все" 
              icon="pi pi-save" 
              @click="saveAllSettings"
              :loading="savingAll"
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
        <div class="grid">
          <!-- 2FA Настройки -->
          <div class="col-12 lg:col-6">
            <Card class="h-full">
              <template #title>
                <div class="flex align-items-center justify-content-between">
                  <div class="flex align-items-center">
                    <i class="pi pi-lock mr-2"></i>
                    Двухфакторная аутентификация
                  </div>
                  <Button 
                    icon="pi pi-save" 
                    @click="save2FASettings"
                    :loading="saving2FA"
                    class="pi p-button-text p-button-sm"
                    title="Сохранить настройки 2FA"
                    v-tooltip.top="'Сохранить только настройки 2FA'"
                  />
                </div>
              </template>
              <template #content>
                <div class="field-checkbox mb-4">
                  <Checkbox 
                    v-model="securitySettings.twoFactorEnabled" 
                    :binary="true" 
                    inputId="twoFactorEnabled"
                  />
                  <label for="twoFactorEnabled" class="ml-2">
                    Включить обязательную 2FA для всех пользователей
                  </label>
                </div>
                
                <div class="field-checkbox mb-4">
                  <Checkbox 
                    v-model="securitySettings.enforceForAdmins" 
                    :binary="true" 
                    inputId="enforceForAdmins"
                    :disabled="!securitySettings.twoFactorEnabled"
                  />
                  <label for="enforceForAdmins" class="ml-2">
                    Обязательная 2FA для администраторов
                  </label>
                </div>
                
                <div class="field-checkbox">
                  <Checkbox 
                    v-model="securitySettings.rememberDevices" 
                    :binary="true" 
                    inputId="rememberDevices"
                    :disabled="!securitySettings.twoFactorEnabled"
                  />
                  <label for="rememberDevices" class="ml-2">
                    Запоминать устройства (30 дней)
                  </label>
                </div>

                <Divider />

                <div class="current-status">
                  <h4>Текущий статус 2FA:</h4>
                  <Tag 
                    :value="current2FAStatus ? 'Включено' : 'Выключено'" 
                    :severity="current2FAStatus ? 'success' : 'danger'" 
                    class="mt-2"
                  />
                  <small class="text-500 block mt-2">
                    Последнее обновление: {{ lastUpdated }}
                  </small>
                </div>
              </template>
            </Card>
          </div>

          <!-- Белый список доменов -->
          <div class="col-12 lg:col-6">
            <Card class="h-full">
              <template #title>
                <div class="flex align-items-center justify-content-between">
                  <div class="flex align-items-center">
                    <i class="pi pi-check-circle mr-2"></i>
                    Белый список доменов
                    <Tag :value="whitelistCount" severity="info" class="ml-2" />
                  </div>
                  <div class="flex gap-1">
                    <Button 
                      icon="pi pi-trash" 
                      @click="clearWhitelist"
                      :disabled="!securitySettings.whitelistDomains || loading || !mailRoutingApiAvailable"
                      class="p-button-text p-button-sm p-button-danger"
                      title="Очистить белый список"
                      v-tooltip.top="'Очистить все домены из белого списка'"
                    />
                    <Button 
                      icon="pi pi-save" 
                      @click="saveDomainSettings"
                      :loading="savingDomains"
                      :disabled="!mailRoutingApiAvailable"
                      class="p-button-text p-button-sm"
                      title="Сохранить доменные политики"
                      v-tooltip.top="'Сохранить только доменные политики'"
                    />
                  </div>
                </div>
                <Tag 
                  v-if="!mailRoutingApiAvailable" 
                  value="API недоступно" 
                  severity="warning" 
                  class="ml-2 mt-1" 
                />
              </template>
              <template #content>
                <div class="mb-3">
                  <label class="block mb-2">Домены для приема почты:</label>
                  <Textarea 
                    v-model="securitySettings.whitelistDomains" 
                    rows="5"
                    placeholder="example.com&#10;another-domain.org&#10;your-company.com"
                    class="w-full"
                    :disabled="loading || !mailRoutingApiAvailable"
                  />
                  <small class="text-500">Укажите домены через перенос строки</small>
                </div>
                
                <div class="domain-stats">
                  <small class="text-500">
                    Домены: {{ whitelistCount }} | Символов: {{ securitySettings.whitelistDomains.length }}
                  </small>
                </div>
              </template>
            </Card>
          </div>

          <!-- Черный список доменов -->
<!-- Черный список доменов -->
          <div class="col-12 lg:col-6">
            <Card class="h-full">
              <template #title>
                <div class="flex align-items-center justify-content-between">
                  <div class="flex align-items-center">
                    <i class="pi pi-ban mr-2"></i>
                    Черный список доменов
                    <Tag :value="blacklistCount" severity="danger" class="ml-2" />
                  </div>
                  <div class="flex gap-1">
                    <Button 
                      icon="pi pi-trash" 
                      @click="clearBlacklist"
                      :disabled="!securitySettings.blacklistDomains || loading || !mailRoutingApiAvailable"
                      class="p-button-text p-button-sm p-button-danger"
                      title="Очистить черный список"
                      v-tooltip.top="'Очистить все домены из черного списка'"
                    />
                    <Button 
                      icon="pi pi-save" 
                      @click="saveDomainSettings"
                      :loading="savingDomains"
                      :disabled="!mailRoutingApiAvailable"
                      class="p-button-text p-button-sm"
                      title="Сохранить доменные политики"
                      v-tooltip.top="'Сохранить только доменные политики'"
                    />
                  </div>
                </div>
              </template>
              <template #content>
                <div class="mb-3">
                  <label class="block mb-2">Заблокированные домены:</label>
                  <Textarea 
                    v-model="securitySettings.blacklistDomains" 
                    rows="5"
                    placeholder="spam-domain.com&#10;malicious-site.org&#10;phishing-site.com"
                    class="w-full"
                    :disabled="loading || !mailRoutingApiAvailable"
                  />
                  <small class="text-500">Укажите домены через перенос строки</small>
                </div>
                
                <div class="domain-stats">
                  <small class="text-500">
                    Домены: {{ blacklistCount }} | Символов: {{ securitySettings.blacklistDomains.length }}
                  </small>
                </div>
              </template>
            </Card>
          </div>

          <!-- Статус и действия -->
          <div class="col-12 lg:col-6">
            <Card class="h-full">
              <template #title>
                <i class="pi pi-info-circle mr-2"></i>
                Информация и действия
              </template>
              <template #content>
                <div class="status-info">
                  <div class="info-item">
                    <i class="pi pi-check-circle text-green-500 mr-2"></i>
                    <span class="mr-1">2FA организация: </span>
                    <Tag 
                      :value="securitySettings.twoFactorEnabled ? 'Включено' : 'Выключено'" 
                      :severity="securitySettings.twoFactorEnabled ? 'success' : 'danger'" 
                    />
                  </div>
                  
                  <div class="info-item mt-3">
                    <i class="pi pi-list text-blue-500 mr-2"></i>
                    <span class="mr-1">Белый список: </span>
                    <Tag :value="whitelistCount" severity="info" />
                  </div>
                  
                  <div class="info-item mt-3">
                    <i class="pi pi-ban text-red-500 mr-2"></i>
                    <span class="mr-1">Черный список: </span>
                    <Tag :value="blacklistCount" severity="danger" />
                  </div>
                </div>

                <Divider />
                <div class="quick-actions">
                  <Button 
                    label="Проверить текущие настройки" 
                    icon="pi pi-eye"
                    @click="loadSettings"
                    :loading="loading"
                    class="w-full mb-2"
                  />
                  
                  <Button 
                    label="Сбросить не сохраненные изменения" 
                    icon="pi pi-refresh"
                    @click="resetChanges"
                    severity="secondary"
                    class="w-full mb-2"
                  />

                  <Button 
                    label="Очистить все доменные списки" 
                    icon="pi pi-trash"
                    @click="clearAllDomains"
                    severity="danger"
                    class="w-full mb-2"
                    :disabled="!securitySettings.whitelistDomains && !securitySettings.blacklistDomains"
                  />
                  <Button 
                    label="Сохранить все настройки" 
                    icon="pi pi-save"
                    @click="saveAllSettings"
                    :loading="savingAll"
                    class="w-full"
                  />
                </div>
              </template>
            </Card>
          </div>
        </div>
      </template>
    </Card>

    <!-- Диалог подтверждения -->
    <Dialog 
      v-model:visible="showConfirmDialog" 
      header="Подтверждение сохранения"
      :style="{ width: '450px' }"
      :modal="true"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span>Вы уверены, что хотите сохранить все изменения настроек безопасности?</span>
      </div>
      
      <template #footer>
        <Button 
          label="Отмена" 
          @click="showConfirmDialog = false" 
          class="p-button-text" 
        />
        <Button 
          label="Сохранить все" 
          @click="confirmSaveAll" 
          icon="pi pi-check"
          autofocus
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRouter, useRoute } from 'vue-router'
import { yandexApiService } from '../services/apiYandexServices'
import { useAccountsStore } from '../stores/accounts'

const router = useRouter()
const route = useRoute()
const accountsStore = useAccountsStore()
const toast = useToast()

const loading = ref(false)
const saving2FA = ref(false)
const savingDomains = ref(false)
const savingAll = ref(false)
const account = ref(null)
const showConfirmDialog = ref(false)
const originalSettings = ref({})
const lastUpdated = ref(new Date().toLocaleString())
const mailRoutingApiAvailable = ref(false)

// Настройки безопасности
const securitySettings = reactive({
  twoFactorEnabled: false,
  enforceForAdmins: true,
  rememberDevices: true,
  whitelistDomains: '',
  blacklistDomains: ''
})

// Computed properties
const accountId = computed(() => parseInt(route.params.accountId))
const whitelistCount = computed(() => {
  return securitySettings.whitelistDomains
    .split('\n')
    .filter(domain => domain.trim().length > 0)
    .length
})
const blacklistCount = computed(() => {
  return securitySettings.blacklistDomains
    .split('\n')
    .filter(domain => domain.trim().length > 0)
    .length
})
const current2FAStatus = computed(() => securitySettings.twoFactorEnabled)
const hasChanges = computed(() => {
  return JSON.stringify(securitySettings) !== JSON.stringify(originalSettings.value)
})

// Навигация
const goBackToServices = () => {
  if (hasChanges.value) {
    if (confirm('Есть несохраненные изменения. Вы уверены, что хотите выйти?')) {
      router.push(`/api-services/${accountId.value}`)
    }
  } else {
    router.push(`/api-services/${accountId.value}`)
  }
}

// Загрузка данных аккаунта
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

// Загрузка настроек
const loadSettings = async () => {
  if (!account.value) return
  
  loading.value = true
  try {
    // Проверяем доступность API маршрутизации почты
    try {
      mailRoutingApiAvailable.value = await yandexApiService.checkMailRoutingApi(account.value.organization_id)
    } catch (error) {
      mailRoutingApiAvailable.value = false
      console.warn('Mail routing API check failed:', error)
    }
    
    // Загрузка настроек 2FA
    try {
      const twoFASettings = await yandexApiService.get2FAStatus(account.value.organization_id)
      if (twoFASettings) {
        securitySettings.twoFactorEnabled = twoFASettings.enabled ?? false
        securitySettings.enforceForAdmins = twoFASettings.enforceForAdmins ?? true
        securitySettings.rememberDevices = twoFASettings.rememberDevices ?? true
      }
    } catch (error) {
      console.warn('Failed to load 2FA settings:', error)
    }
    
    // Загрузка белого списка доменов (если API доступно)
    if (mailRoutingApiAvailable.value) {
      try {
        const whitelist = await yandexApiService.getWhitelistDomains(account.value.organization_id)
        securitySettings.whitelistDomains = Array.isArray(whitelist) ? 
          whitelist.filter(d => d).join('\n') : ''
      } catch (error) {
        console.warn('Failed to load whitelist:', error)
        securitySettings.whitelistDomains = ''
      }
    }
    
    // Загрузка черного списка доменов (если API доступно)
    if (mailRoutingApiAvailable.value) {
      try {
        const blacklist = await yandexApiService.getBlacklistDomains(account.value.organization_id)
        securitySettings.blacklistDomains = Array.isArray(blacklist) ? 
          blacklist.filter(d => d).join('\n') : ''
      } catch (error) {
        console.warn('Failed to load blacklist:', error)
        securitySettings.blacklistDomains = ''
      }
    }
    
    // Сохраняем оригинальные настройки
    originalSettings.value = { ...securitySettings }
    lastUpdated.value = new Date().toLocaleString()
    
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Настройки загружены',
      life: 3000
    })
    
  } catch (error) {
    console.error('Error loading security settings:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить настройки',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Сохранение только настроек 2FA
const save2FASettings = async () => {
  saving2FA.value = true
  try {
    await yandexApiService.update2FAStatus(
      account.value.organization_id,
      {
        enabled: securitySettings.twoFactorEnabled,
        enforceForAdmins: securitySettings.enforceForAdmins,
        rememberDevices: securitySettings.rememberDevices
      }
    )
    
    // Обновляем оригинальные настройки для 2FA
    originalSettings.value.twoFactorEnabled = securitySettings.twoFactorEnabled
    originalSettings.value.enforceForAdmins = securitySettings.enforceForAdmins
    originalSettings.value.rememberDevices = securitySettings.rememberDevices
    
    lastUpdated.value = new Date().toLocaleString()
    
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Настройки 2FA сохранены',
      life: 3000
    })
    
  } catch (error) {
    console.error('Error saving 2FA settings:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось сохранить настройки 2FA',
      life: 3000
    })
  } finally {
    saving2FA.value = false
  }
}

const saveDomainSettings = async () => {
  if (!mailRoutingApiAvailable.value) {
    toast.add({
      severity: 'warn',
      summary: 'Недоступно',
      detail: 'API доменных политик недоступно',
      life: 3000
    })
    return
  }
  
  savingDomains.value = true
  try {
    // Подготавливаем данные для отправки
    const whitelistArray = securitySettings.whitelistDomains
      .split('\n')
      .filter(domain => domain.trim())
      .map(domain => domain.trim())
    
    const blacklistArray = securitySettings.blacklistDomains
      .split('\n')
      .filter(domain => domain.trim())
      .map(domain => domain.trim())
    
    // console.log('Saving domain settings:', {
    //   whitelist: whitelistArray,
    //   blacklist: blacklistArray
    // })
    
    // Отправляем данные
    await yandexApiService.updateDomainLists(
      account.value.organization_id,
      whitelistArray,
      blacklistArray
    )
    
    // Обновляем оригинальные настройки для доменов
    originalSettings.value.whitelistDomains = securitySettings.whitelistDomains
    originalSettings.value.blacklistDomains = securitySettings.blacklistDomains
    
    lastUpdated.value = new Date().toLocaleString()
    
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Доменные политики сохранены',
      life: 3000
    })
    
  } catch (error) {
    console.error('Error saving domain policies:', error)
    
    let errorDetail = 'Не удалось сохранить доменные политики'
    if (error.message.includes('прав')) {
      errorDetail = 'Недостаточно прав для управления доменными политиками'
    } else if (error.message.includes('Internal error')) {
      errorDetail = 'Внутренняя ошибка Яндекс API. Попробуйте позже.'
    }
    
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: errorDetail,
      life: 3000
    })
  } finally {
    savingDomains.value = false
  }
}

// Сохранение всех настроек
const saveAllSettings = () => {
  if (hasChanges.value) {
    showConfirmDialog.value = true
  } else {
    toast.add({
      severity: 'info',
      summary: 'Нет изменений',
      detail: 'Нет изменений для сохранения',
      life: 3000
    })
  }
}

const confirmSaveAll = async () => {
  showConfirmDialog.value = false
  savingAll.value = true
  
  try {
    const results = []
    
    // Сохраняем 2FA настройки
    try {
      await save2FASettings()
      results.push('2FA настройки сохранены')
    } catch (error) {
      results.push('Ошибка сохранения 2FA')
    }
    
    // Сохраняем доменные политики
    if (mailRoutingApiAvailable.value) {
      try {
        await saveDomainSettings()
        results.push('Доменные политики сохранены')
      } catch (error) {
        results.push('Ошибка сохранения доменных политик')
      }
    }
    
    // Показываем общий результат
    if (results.every(r => r.includes('сохранены'))) {
      toast.add({
        severity: 'success',
        summary: 'Все настройки сохранены',
        detail: 'Все изменения успешно применены',
        life: 3000
      })
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Частично успешно',
        detail: results.join(', '),
        life: 5000
      })
    }
    
  } catch (error) {
    console.error('Error saving all settings:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось сохранить настройки',
      life: 3000
    })
  } finally {
    savingAll.value = false
  }
}

// Сброс изменений
const resetChanges = () => {
  if (hasChanges.value) {
    if (confirm('Вы уверены, что хотите отменить все изменения?')) {
      Object.assign(securitySettings, originalSettings.value)
      toast.add({
        severity: 'info',
        summary: 'Изменения отменены',
        detail: 'Все изменения сброшены',
        life: 3000
      })
    }
  } else {
    toast.add({
      severity: 'info',
      summary: 'Нет изменений',
      detail: 'Нет изменений для отмены',
      life: 3000
    })
  }
}
// Методы для очистки списков
const clearWhitelist = () => {
  if (securitySettings.whitelistDomains && securitySettings.whitelistDomains.length > 0) {
    if (confirm('Вы уверены, что хотите очистить белый список доменов?')) {
      securitySettings.whitelistDomains = ''
      toast.add({
        severity: 'info',
        summary: 'Белый список очищен',
        detail: 'Все домены удалены из белого списка',
        life: 3000
      })
    }
  } else {
    toast.add({
      severity: 'info',
      summary: 'Список пуст',
      detail: 'Белый список уже пуст',
      life: 3000
    })
  }
}

const clearBlacklist = () => {
  if (securitySettings.blacklistDomains && securitySettings.blacklistDomains.length > 0) {
    if (confirm('Вы уверены, что хотите очистить черный список доменов?')) {
      securitySettings.blacklistDomains = ''
      toast.add({
        severity: 'info',
        summary: 'Черный список очищен',
        detail: 'Все домены удалены из черного списка',
        life: 3000
      })
    }
  } else {
    toast.add({
      severity: 'info',
      summary: 'Список пуст',
      detail: 'Черный список уже пуст',
      life: 3000
    })
  }
}

// Также можно добавить метод для очистки обоих списков
const clearAllDomains = () => {
  if (confirm('Вы уверены, что хотите очистить оба списка доменов?')) {
    securitySettings.whitelistDomains = ''
    securitySettings.blacklistDomains = ''
    toast.add({
      severity: 'info',
      summary: 'Списки очищены',
      detail: 'Белый и черный списки доменов очищены',
      life: 3000
    })
  }
}
// Загрузка при монтировании
onMounted(async () => {
  await loadAccountData()
  if (account.value) {
    await loadSettings()
  }
})

// Следим за изменениями для показа предупреждения при переходе
window.addEventListener('beforeunload', (e) => {
  if (hasChanges.value) {
    e.preventDefault()
    e.returnValue = 'Есть несохраненные изменения. Вы уверены, что хотите уйти?'
  }
})
</script>

<style scoped>
.security-settings-page {
  width: 100%;
  padding: 1rem;
}

.account-info {
  padding: 0.5rem 0;
  border-top: 1px solid var(--surface-border);
  margin-top: 0.5rem;
}

:deep(.p-card) {
  margin-bottom: 1rem;
}

.field-checkbox {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
}

.domain-stats {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

.current-status {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  margin-top: 1rem;
}

.confirmation-content {
  display: flex;
  align-items: center;
}

.quick-actions {
  margin-top: 1rem;
}

:deep(.p-button) {
  justify-content: start;
}

:deep(.p-button.p-button-sm) {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.domain-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
<template>
  <Dialog 
    :visible="internalVisible" 
    @update:visible="onDialogUpdate"
    :header="user ? getUserDisplayName(user) : 'Информация о пользователе'" 
    :style="{ width: '600px' }"
    :modal="true"
  >
      <div v-if="user" class="user-details">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label>Email:</label>
              <span>{{ user.email || 'Не указан' }}</span>
            </div>
            <div class="detail-item">
              <label>Телефон:</label>
              <span>{{ getPhoneNumber(user) || 'Не указан' }}</span>
            </div>
            <div class="detail-item">
              <label>Отдел:</label>
              <span>{{ user.department || 'Не указан' }}</span>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="detail-item">
              <label>Должность:</label>
              <span>{{ user.position || 'Не указана' }}</span>
            </div>
            <div class="detail-item">
              <label>Статус:</label>
              <Tag 
                :value="user.isEnabled ? 'Активен' : 'Неактивен'" 
                :severity="user.isEnabled ? 'success' : 'danger'" 
              />
            </div>
            <div class="detail-item">
              <label>2FA:</label>
              <Tag 
                :value="current2FAStatus ? 'Включено' : 'Отключено'" 
                :severity="current2FAStatus ? 'success' : 'warning'" 
              />
            </div>
          </div>
        </div>
  
        <Divider />
  
        <div class="actions">
          <Button 
            :label="current2FAStatus ? 'Отключить 2FA' : 'Включить 2FA'" 
            :icon="current2FAStatus ? 'pi pi-lock-open' : 'pi pi-lock'"
            @click="toggle2FA"
            :loading="loading2FA"
            class="p-button-text"
            :disabled="!user.isEnabled"
          />
          <Button 
            label="Редактировать" 
            icon="pi pi-pencil"
            @click="editUser"
            class="p-button-text"
          />
        </div>
      </div>
      
      <div v-else class="loading">
        <ProgressSpinner />
      </div>
  
      <template #footer>
        <Button label="Закрыть" @click="closeDialog" />
      </template>
    </Dialog>
  </template>
  
  <script setup>
  import { ref, watch, computed } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { yandexApiService } from '../../services/apiYandexServices'
  
  const props = defineProps({
  visible: Boolean,
  user: Object,
  account: Object
})
  
const emit = defineEmits(['update:visible', 'edit-user', 'user-updated']) 
const toast = useToast()
  
const loading2FA = ref(false)
const current2FAStatus = ref(false)
const internalVisible = ref(props.visible) // ИЗМЕНИТЬ: props.visible
  
  // Синхронизируем внутреннее состояние с props
  watch(() => props.visible, (newVal) => { // ИЗМЕНИТЬ: props.visible
  internalVisible.value = newVal
})
  // Обработчик обновления диалога
  const onDialogUpdate = (value) => {
  internalVisible.value = value
  emit('update:visible', value) // ИЗМЕНИТЬ: update:visible
}
  
  // Закрытие диалога
  const closeDialog = () => {
  internalVisible.value = false
  emit('update:visible', false) // ИЗМЕНИТЬ: update:visible
}
  // Функция для отображения имени
  const getUserDisplayName = (user) => {
    if (!user) return 'Неизвестно'
    
    if (user.name && typeof user.name === 'object') {
      const firstName = user.name.first || ''
      const lastName = user.name.last || ''
      const fullName = `${firstName} ${lastName}`.trim()
      return fullName || user.nickname || user.email || 'Неизвестный пользователь'
    }
    
    return user.nickname || user.email || 'Неизвестный пользователь'
  }
  
  // Функция для получения номера телефона
  const getPhoneNumber = (user) => {
    if (!user.contacts || !Array.isArray(user.contacts)) return null
    
    const phoneContact = user.contacts.find(contact => 
      contact.type === 'phone' || contact.type === 'mobile'
    )
    return phoneContact ? phoneContact.value : null
  }
  
  // Загружаем статус 2FA при открытии диалога
  watch(internalVisible, async (newVal) => {
    if (newVal && props.user && props.account) {
      await load2FAStatus()
    }
  })
  
// Загрузка статуса 2FA
const load2FAStatus = async () => {
  try {
    // console.log('Loading 2FA for user:', props.user.id)
    
    const status = await yandexApiService.getUser2FAStatus(
      props.account.organization_id, 
      props.user.id
    )
    
    // console.log('2FA API RESPONSE:', status)
    
    // Обрабатываем оба варианта: сырой ответ и преобразованный
    if (status && typeof status === 'object') {
      // Если бэкенд вернул преобразованный объект с полем enabled
      if (status.enabled !== undefined) {
        current2FAStatus.value = status.enabled
        // console.log('Using enabled field from backend:', status.enabled)
      }
      // Если бэкенд вернул сырой ответ с has2fa
      else if (status.has2fa !== undefined) {
        current2FAStatus.value = status.has2fa
        // console.log('Using has2fa field from API:', status.has2fa)
      }
      else if (status['2fa_enabled'] !== undefined) {
        current2FAStatus.value = status['2fa_enabled']
        // console.log('Using 2fa_enabled field:', status['2fa_enabled'])
      }
      else {
        current2FAStatus.value = false
      }
    } else {
      current2FAStatus.value = false
    }
    
    // console.log('Final 2FA status:', current2FAStatus.value)
    
  } catch (error) {
    console.error('Error loading 2FA status:', error)
    current2FAStatus.value = false
  }
}
  
  const toggle2FA = async () => {
    if (loading2FA.value) return
    
    loading2FA.value = true
    try {
      if (current2FAStatus.value) {
        await yandexApiService.disableUser2FA(
          props.account.organization_id, 
          props.user.id
        )
        current2FAStatus.value = false
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: '2FA отключено',
          life: 3000
        })
      } else {
        await yandexApiService.enableUser2FA(
          props.account.organization_id, 
          props.user.id
        )
        current2FAStatus.value = true
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: '2FA включено',
          life: 3000
        })
      }
      
      emit('user-updated', {
        ...props.user,
        has2fa: current2FAStatus.value
      })
      
    } catch (error) {
      console.error('Error toggling 2FA:', error)
      
      let errorMessage = 'Не удалось изменить статус 2FA'
      
      if (error.message.includes('not_org_user') || error.response?.status === 404) {
        errorMessage = 'Нельзя изменить 2FA для неактивного пользователя'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: errorMessage,
        life: 3000
      })
    } finally {
      loading2FA.value = false
    }
  }
  
  const editUser = () => {
    emit('edit-user', props.user)
    closeDialog()
  }
  </script>
  
  <style scoped>
  .user-details {
    padding: 1rem 0;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
  }
  
  .detail-item label {
    font-weight: 600;
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
  }
  
  .detail-item span {
    color: var(--text-color);
    font-size: 1rem;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }
  
  .loading {
    display: flex;
    justify-content: center;
    padding: 2rem;
  }
  </style>
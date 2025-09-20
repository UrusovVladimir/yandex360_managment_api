<template>
    <div class="create-user-form compact">
      <form @submit.prevent="submitForm">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="field mb-3">
              <label class="block mb-2">Имя пользователя *</label>
              <InputText 
                v-model="formData.username" 
                class="w-full" 
                required
                :class="{ 'p-invalid': errors.username }"
                placeholder="Введите имя пользователя"
                autocomplete="username"
              />
              <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="field mb-3">
              <label class="block mb-2">Email *</label>
              <InputText 
                v-model="formData.email" 
                class="w-full" 
                type="email"
                required
                :class="{ 'p-invalid': errors.email }"
                placeholder="Введите email"
                autocomplete="email"
              />
              <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
            </div>
          </div>
        </div>
  
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="field mb-3">
              <label class="block mb-2">Пароль *</label>
              <Password 
                v-model="formData.password" 
                class="w-full" 
                :feedback="false"
                toggleMask
                required
                :class="{ 'p-invalid': errors.password }"
                placeholder="Введите пароль"
                inputClass="w-full"
              >
                <template #input="slotProps">
                  <input 
                    v-bind="slotProps" 
                    autocomplete="new-password"
                  />
                </template>
              </Password>
              <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="field mb-3">
              <label class="block mb-2">Подтверждение *</label>
              <Password 
                v-model="formData.confirmPassword" 
                class="w-full" 
                :feedback="false"
                toggleMask
                required
                :class="{ 'p-invalid': errors.confirmPassword }"
                placeholder="Подтвердите пароль"
                inputClass="w-full"
              >
                <template #input="slotProps">
                  <input 
                    v-bind="slotProps" 
                    autocomplete="new-password"
                  />
                </template>
              </Password>
              <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
            </div>
          </div>
        </div>
  
        <div class="field mb-3">
          <label class="block mb-2">Роль</label>
          <div class="custom-select-container">
            <select 
              v-model="formData.role" 
              class="w-full custom-select"
              :class="{ 'p-invalid': errors.role }"
            >
              <option value="">Выберите роль</option>
              <option value="user">Пользователь</option>
              <option value="moderator">Модератор</option>
              <option value="admin">Администратор</option>
            </select>
            <i class="pi pi-chevron-down select-arrow"></i>
          </div>
          <small v-if="errors.role" class="p-error">{{ errors.role }}</small>
        </div>
  
        <div class="flex justify-content-end gap-2 mt-4">
          <Button 
            label="Отмена" 
            icon="pi pi-times" 
            @click="cancel"
            class="p-button-text"
          />
          <Button 
            type="submit"
            label="Создать" 
            icon="pi pi-check" 
            :loading="loading"
            :disabled="loading"
          />
        </div>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, watch } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import InputText from 'primevue/inputtext'
  import Button from 'primevue/button'

  const props = defineProps({
    account: {
      type: Object,
      required: true
    }
  })
  
  const emit = defineEmits(['userCreated', 'cancel'])
  
  const toast = useToast()
  const loading = ref(false)
  
  const formData = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' // Устанавливаем значение по умолчанию
  })
  
  const errors = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  })
  
  const roleOptions = ref([
    { label: 'Пользователь', value: 'user' },
    { label: 'Модератор', value: 'moderator' },
    { label: 'Администратор', value: 'admin' }
  ])
  
  // Валидация пароля
  watch(() => formData.password, (newPassword) => {
    if (formData.confirmPassword && newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают'
    } else {
      errors.confirmPassword = ''
    }
  })
  
  watch(() => formData.confirmPassword, (newConfirmPassword) => {
    if (formData.password && newConfirmPassword !== formData.password) {
      errors.confirmPassword = 'Пароли не совпадают'
    } else {
      errors.confirmPassword = ''
    }
  })
  
  const validateForm = () => {
    let isValid = true
  
    // Сброс ошибок
    Object.keys(errors).forEach(key => errors[key] = '')
  
    // Валидация имени пользователя
    if (!formData.username.trim()) {
      errors.username = 'Имя пользователя обязательно'
      isValid = false
    } else if (formData.username.length < 3) {
      errors.username = 'Имя пользователя должно быть не менее 3 символов'
      isValid = false
    }
  
    // Валидация email
    if (!formData.email.trim()) {
      errors.email = 'Email обязателен'
      isValid = false
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Введите корректный email'
      isValid = false
    }
  
    // Валидация пароля
    if (!formData.password) {
      errors.password = 'Пароль обязателен'
      isValid = false
    } else if (formData.password.length < 6) {
      errors.password = 'Пароль должен быть не менее 6 символов'
      isValid = false
    }
  
    // Валидация подтверждения пароля
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Подтверждение пароля обязательно'
      isValid = false
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают'
      isValid = false
    }
  
    // Валидация роли
    if (!formData.role) {
      errors.role = 'Роль обязательна'
      isValid = false
    }
  
    return isValid
  }
  
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  const submitForm = async () => {
    if (!validateForm()) return
  
    loading.value = true
  
    try {
      // Имитация API запроса
      const response = await mockCreateUserApiCall(formData)
      
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Пользователь создан',
        life: 3000
      })
  
      // Эмитируем событие с данными пользователя
      emit('userCreated', {
        ...formData,
        id: response.userId,
        createdAt: new Date().toISOString()
      })
  
      // Очищаем форму
      resetForm()
  
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: error.message,
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }
  
  const cancel = () => {
    resetForm()
    emit('cancel')
  }
  
  const resetForm = () => {
    formData.username = ''
    formData.email = ''
    formData.password = ''
    formData.confirmPassword = ''
    formData.role = 'user' // Сбрасываем к значению по умолчанию
    
    Object.keys(errors).forEach(key => errors[key] = '')
  }
  
  // Заглушка для API создания пользователя
  const mockCreateUserApiCall = (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 10% chance of error for demonstration
        if (Math.random() < 0.1) {
          reject(new Error('Ошибка при создании пользователя. Попробуйте позже.'))
        } else {
          resolve({
            success: true,
            userId: Math.floor(Math.random() * 1000) + 1000,
            message: 'Пользователь успешно создан'
          })
        }
      }, 1500)
    })
  }
  </script>
  
  <style scoped>
  .create-user-form.compact {
    padding: 0.5rem;
  }
  
  .create-user-form.compact .field {
    margin-bottom: 1rem;
  }
  
  :deep(.p-password) {
    width: 100%;
  }
  
  :deep(.p-password input) {
    width: 100%;
  }
  
  :deep(.p-error) {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
  }
  
  /* Адаптивность для мобильных устройств */
  @media (max-width: 768px) {
    .create-user-form.compact .grid .col-md-6 {
      width: 100%;
      flex: 0 0 100%;
      max-width: 100%;
    }
  }

  .custom-select-container {
  position: relative;
}

.custom-select {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  font-size: 1rem;
  appearance: none;
  padding-right: 2.5rem;
}

.custom-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.2);
}

.select-arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #6c757d;
}

.p-invalid {
  border-color: #e24c4c !important;
}
  
  </style>
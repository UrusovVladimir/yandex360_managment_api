<template>
  <div class="register-container">
    <div class="register-card">
      <div class="card-header">
        <i class="pi pi-user-plus"></i>
        <h2>Создание аккаунта</h2>
      </div>

      <div class="card-title">
        <h2>Регистрация</h2>
        <p>Создайте новую учетную запись</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="field">
          <label>Имя пользователя *</label>
          <input 
            v-model="userData.username" 
            type="text" 
            placeholder="Придумайте имя пользователя"
            :class="{ 'error': errorMessages.username }"
            required
          />
          <small v-if="errorMessages.username" class="error-text">{{ errorMessages.username }}</small>
          <small v-else class="hint-text">От 3 до 20 символов</small>
        </div>

        <div class="field">
          <label>Email *</label>
          <input 
            v-model="userData.email" 
            type="email" 
            placeholder="Введите ваш email"
            :class="{ 'error': errorMessages.email }"
            required
          />
          <small v-if="errorMessages.email" class="error-text">{{ errorMessages.email }}</small>
        </div>

        <div class="field">
          <label>Пароль *</label>
          <input 
            v-model="userData.password" 
            type="password"
            placeholder="Придумайте пароль"
            :class="{ 'error': errorMessages.password }"
            required
          />
          <small v-if="errorMessages.password" class="error-text">{{ errorMessages.password }}</small>
        </div>

        <div class="field">
          <label>Подтверждение пароля *</label>
          <input 
            v-model="userData.confirmPassword" 
            type="password"
            placeholder="Повторите пароль"
            :class="{ 'error': errorMessages.confirmPassword }"
            required
          />
          <small v-if="errorMessages.confirmPassword" class="error-text">{{ errorMessages.confirmPassword }}</small>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>

        <div class="divider">или</div>

        <div class="login-link">
          <span>Уже есть аккаунт? </span>
          <router-link to="/login">Войти</router-link>
        </div>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const userData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const errorMessages = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')

const validateForm = () => {
  let isValid = true
  errorMessages.username = errorMessages.email = errorMessages.password = errorMessages.confirmPassword = ''

  if (userData.username.length < 3) {
    errorMessages.username = 'Имя пользователя должно содержать минимум 3 символа'
    isValid = false
  }

  if (!userData.email.includes('@')) {
    errorMessages.email = 'Введите корректный email адрес'
    isValid = false
  }

  if (userData.password.length < 6) {
    errorMessages.password = 'Пароль должен содержать минимум 6 символов'
    isValid = false
  }

  if (userData.password !== userData.confirmPassword) {
    errorMessages.confirmPassword = 'Пароли не совпадают'
    isValid = false
  }

  return isValid
}

const handleRegister = async () => {
  if (!validateForm()) {
    error.value = 'Пожалуйста, проверьте правильность заполнения полей'
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    await authStore.register({
      username: userData.username,
      email: userData.email,
      password: userData.password
    })
    
    // Автоматический переход после успешной регистрации
    setTimeout(() => {
      router.push('/')
    }, 1500)
    
  } catch (err) {
    error.value = err.message || 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
  padding: 1rem;
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 1.5rem;
}

.card-header i {
  font-size: 2rem;
  color: #3b82f6;
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.card-title {
  text-align: center;
  margin-bottom: 2rem;
}

.card-title h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.card-title p {
  color: #6b7280;
  margin: 0;
}

.field {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}

input.error {
  border-color: #dc2626;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
  display: block;
  margin-top: 0.25rem;
}

.hint-text {
  color: #6b7280;
  font-size: 0.875rem;
  display: block;
  margin-top: 0.25rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background: #2563eb;
}

button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}

.divider::before {
  margin-right: 0.5rem;
}

.divider::after {
  margin-left: 0.5rem;
}

.login-link {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.login-link a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  text-align: center;
}
</style>
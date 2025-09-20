<template>
  <div class="login-container">
    <div class="login-card">
      <div class="card-header">
        <i class="pi pi-server"></i>
        <h2>API Management</h2>
      </div>

      <div class="card-title">
        <h2>Добро пожаловать</h2>
        <p>Войдите в свою учетную запись</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label>Имя пользователя</label>
          <input 
            v-model="credentials.username" 
            type="text" 
            placeholder="Введите имя пользователя"
            required
            autocomplete="username"
          />
        </div>

        <div class="field password-field">
          <label>Пароль</label>
          <div class="password-input-wrapper">
            <input 
              v-model="credentials.password" 
              :type="showPassword ? 'text' : 'password'"
              placeholder="Введите пароль"
              required
              class="password-input"
              autocomplete="current-password"
            />
            <span 
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </span>
          </div>
        </div>

        <button type="submit" :disabled="loading" style="margin-top: 20px;">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>

        <!-- <div class="divider">или</div> -->

        <!-- <div class="register-link">
          <span>Нет аккаунта? </span>
          <router-link to="/register">Зарегистрироваться</router-link>
        </div> -->
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const showPassword = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const credentials = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(credentials.value)
    router.push('/')
  } catch (err) {
    error.value = err.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Исправляем проблемы с размерами и скроллингом */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
  padding: 1rem;
  box-sizing: border-box;
  margin: 0;
  width: 100%;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

/* .register-link {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
} */

/* .register-link a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
} */

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  text-align: center;
}

.password-field {
  position: relative;
}

.password-input-wrapper {
  position: relative;
}

.password-input {
  padding-right: 40px;
  width: 100%;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;
  z-index: 2;
}

.password-toggle:hover {
  color: #3b82f6;
  background-color: #f3f4f6;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 480px) {
  .login-container {
    padding: 0.5rem;
    align-items: flex-start;
    padding-top: 2rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .login-card {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .card-header i {
    font-size: 1.75rem;
  }
  
  .card-header h2 {
    font-size: 1.25rem;
  }
  
  .card-title h2 {
    font-size: 1.25rem;
  }
  
  input, button {
    padding: 0.625rem;
  }
}

/* Убираем лишние отступы у body */
:global(body) {
  margin: 0;
  padding: 0;
}

:global(#app) {
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
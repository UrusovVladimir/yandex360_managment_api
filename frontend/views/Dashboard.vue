<template>
  <div class="dashboard-minimal">
    <div class="container">
      <!-- Заголовок -->
      <div class="text-center mb-6">
        <h1 class="title">Панель управления</h1>
        <p class="subtitle">Управление системой</p>
      </div>

      <!-- Статистика -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">
              {{ usersStore.loading ? '...' : usersCount }}
            </div>
            <div class="stat-label">Агенты</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-desktop"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">
              {{ accountsStore.loading ? '...' : accoutsCount }}
            </div>
            <div class="stat-label">Аккаунты</div>
          </div>
        </div>
      </div>

      <!-- Быстрый доступ -->
      <div class="quick-access">
        <h2 class="section-title">Инструменты</h2>
        <div class="actions-grid">
          <router-link 
            v-for="action in quickActions" 
            :key="action.to" 
            :to="action.to" 
            class="action-card"
          >
            <i :class="action.icon"></i>
            <span>{{ action.label }}</span>
          </router-link>
        </div>
      </div>

      <!-- Статус системы -->
<!-- Статус системы -->
      <div class="quick-access">
        <h2 class="section-title">Статус системы</h2>
        <div class="actions-grid">
          <div class="status-card">
            <i class="pi pi-database status-icon" :class="getStatusClass(dbStatus)"></i>
            <div class="status-content">
              <div class="status-name">База данных</div>
              <div class="status-value" :class="getStatusClass(dbStatus)">
                {{ getStatusText(dbStatus) }}
              </div>
            </div>
          </div>

          <div class="status-card">
            <i class="pi pi-cloud status-icon" :class="getStatusClass(apiStatus)"></i>
            <div class="status-content">
              <div class="status-name">API</div>
              <div class="status-value" :class="getStatusClass(apiStatus)">
                {{ getStatusText(apiStatus) }}
              </div>
            </div>
          </div>

          <div class="status-card">
            <i class="pi pi-shield status-icon" :class="getStatusClass(securityStatus)"></i>
            <div class="status-content">
              <div class="status-name">Безопасность</div>
              <div class="status-value" :class="getStatusClass(securityStatus)">
                {{ getStatusText(securityStatus) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useUsersStore } from '../stores/users'
import { useAccountsStore } from '../stores/accounts'

const usersStore = useUsersStore()
const accountsStore = useAccountsStore()

const usersCount = computed(() => {
  return usersStore.users ? usersStore.users.length : 0
})

const accoutsCount = computed(() => {
  return accountsStore.accounts ? accountsStore.accounts.length : 0
})

// Состояния системы
const dbStatus = ref('checking')
const apiStatus = ref('checking')
const securityStatus = ref('checking')

const quickActions = [
  { label: 'Агенты', icon: 'pi pi-users', to: '/users' },
  { label: 'Аккаунты', icon: 'pi pi-desktop', to: '/accounts' },
  { label: 'Профиль', icon: 'pi pi-user', to: '/profile' }
]

// Функция проверки статуса базы данных
const checkDatabaseStatus = async () => {
  try {
    const response = await fetch('/api/health/db', { timeout: 5000 })
    dbStatus.value = response.ok ? 'online' : 'offline'
  } catch (error) {
    dbStatus.value = 'offline'
  }
}

// Функция проверки API
const checkApiStatus = async () => {
  try {
    const response = await fetch('/api/health', { timeout: 3000 })
    apiStatus.value = response.ok ? 'online' : 'offline'
  } catch (error) {
    apiStatus.value = 'offline'
  }
}

// Функция проверки безопасности (упрощенная)
const checkSecurityStatus = async () => {
  try {
    // Проверяем наличие HTTPS в продакшене
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost'
    securityStatus.value = isSecure ? 'secure' : 'insecure'
  } catch (error) {
    securityStatus.value = 'insecure'
  }
}

// Получить текстовое значение статуса
const getStatusText = (status) => {
  const statusMap = {
    online: 'Online',
    offline: 'Offline',
    checking: 'Checking...',
    secure: 'Secure',
    insecure: 'Insecure'
  }
  return statusMap[status] || status
}

// Получить класс для статуса
const getStatusClass = (status) => {
  const classMap = {
    online: 'online',
    secure: 'online',
    offline: 'offline',
    insecure: 'offline',
    checking: 'warning'
  }
  return classMap[status] || 'warning'
}

onMounted(async () => {
  usersStore.fetchUsers()
  accountsStore.fetchAccounts()
  
  // Проверяем статус системы
  await Promise.all([
    checkDatabaseStatus(),
    checkApiStatus(),
    checkSecurityStatus()
  ])
  
  // Периодическая проверка (каждые 30 секунд)
  setInterval(async () => {
    await checkDatabaseStatus()
    await checkApiStatus()
  }, 30000)
})
</script>
<style scoped>
.dashboard-minimal {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--surface-ground);
}

.container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow-2);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary-50);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--primary-500);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-color);
}

.stat-label {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.quick-access {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.8rem;
  margin-bottom: 2rem;
  color: var(--text-color);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: var(--surface-card);
  padding: 2rem 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-2);
  border: 2px solid transparent;
}

.action-card:hover {
  background: var(--primary-50);
  transform: translateY(-5px);
  box-shadow: var(--shadow-4);
  color: var(--primary-600);
  border-color: var(--primary-100);
}

.action-card i {
  font-size: 2.5rem;
}

/* Стили для статусов системы */
.status-card {
  background: var(--surface-card);
  padding: 2rem 1.5rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-2);
  border: 2px solid transparent;
}

/* .status-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-3);
} */

.status-icon {
  font-size: 2.5rem;
  color: var(--primary-500);
  background: var(--primary-50);
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.status-icon.online {
  color: var(--green-500);
  background: var(--green-50);
}

.status-icon.offline {
  color: var(--red-500);
  background: var(--red-50);
}

.status-icon.warning {
  color: var(--yellow-500);
  background: var(--yellow-50);
}

.status-icon.checking {
  color: var(--blue-500);
  background: var(--blue-50);
}
.status-content {
  text-align: center;
}

.status-name {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.status-value {
  font-weight: bold;
  font-size: 1.2rem;
  padding: 0.3rem 1rem;
  border-radius: 20px;
  display: inline-block;
}

.status-value.online {
  background: var(--green-100);
  color: var(--green-700);
}

.status-value.offline {
  background: var(--red-100);
  color: var(--red-700);
}

.status-value.warning {
  background: var(--yellow-100);
  color: var(--yellow-700);
}

/* Адаптивность */
@media (max-width: 768px) {
  .dashboard-minimal {
    padding: 1rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .action-card,
  .status-card {
    padding: 1.5rem 1rem;
  }
  
  .action-card i,
  .status-icon {
    font-size: 2rem;
  }
  
  .status-icon {
    width: 60px;
    height: 60px;
  }
}

/* Анимации */
.action-card,
.status-card,
.stat-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Задержка анимации для последовательного появления */
/* .actions-grid > *:nth-child(1) { animation-delay: 0.1s; }
.actions-grid > *:nth-child(2) { animation-delay: 0.2s; }
.actions-grid > *:nth-child(3) { animation-delay: 0.3s; }
.actions-grid > *:nth-child(4) { animation-delay: 0.4s; }

.stats-grid > *:nth-child(1) { animation-delay: 0.1s; }
.stats-grid > *:nth-child(2) { animation-delay: 0.2s; } */
</style>
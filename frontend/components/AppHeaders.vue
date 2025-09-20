<template>
  <div class="app-header">
    <Menubar :model="menuItems" class="header-menubar">
      <template #start>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-server text-2xl text-primary"></i>
          <span style="padding-right: 10px" class="font-bold text-xl text-primary">Мой {{ titleService }}</span>
        </div>
      </template>

      <template #item="{ item }">
        <router-link 
          :to="item.to" 
          class="p-menuitem-link" 
          :class="{ 'active-route': $route.path === item.to }"
        >
          <span :class="item.icon" class="mr-2"></span>
          <span class="ml-2">{{ item.label }}</span>
          <Badge v-if="item.badge" :value="item.badge" class="ml-2" />
        </router-link>
      </template>

      <template #end>
        <div class="flex align-items-center gap-3">
          <Avatar 
            :label="userInitials" 
            class="bg-primary text-white" 
            size="large" 
            shape="circle" 
          />
          <div class="user-info">
            <div class="font-semibold">{{ user?.username }}</div>
            <div class="text-sm text-color-secondary">{{ user?.email }}</div>
          </div>
          
          <Button 
            icon="pi pi-sign-out" 
            class="p-button-rounded p-button-text p-button-danger" 
            @click="logout"
            title="Выйти"
          />
        </div>
      </template>
    </Menubar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUsersStore } from '../stores/users'
import { useAccountsStore } from '../stores/accounts'
import { storeToRefs } from 'pinia'
import { socket } from '../socket'

const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const accountsStore = useAccountsStore()

const { user } = storeToRefs(authStore)
const { users } = storeToRefs(usersStore)
const { accounts } = storeToRefs(accountsStore)

const titleService = ref(import.meta.env.VITE_SERVICE || 'Сервис')

// Создаем отдельные computed для бейджей
const usersCount = computed(() => users.value.length)
const accountsCount = computed(() => accounts.value.length)

const menuItems = ref([
  {
    label: 'Дашборд',
    icon: 'pi pi-home',
    to: '/'
  },
  {
    label: 'Агенты',
    icon: 'pi pi-users',
    to: '/users',
    badge: usersCount
  },
  {
    label: 'Аккаунты',
    icon: 'pi pi-desktop',
    to: '/accounts',
    badge: accountsCount
  },
  {
    label: 'Профиль',
    icon: 'pi pi-user',
    to: '/profile'
  }
])

const userInitials = computed(() => {
  if (!user.value?.username) return '?'
  return user.value.username.charAt(0).toUpperCase()
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}

// Загружаем данные при монтировании
onMounted(async () => {
  try {
    await usersStore.fetchUsers()
    await accountsStore.fetchAccounts()
    
    // Подключаем сокет (глобальные обработчики уже настроены в socket.js)
    if (!socket.connected) {
      socket.connect()
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  }
})
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-menubar {
  border-radius: 0;
  border: none;
  border-bottom: 1px solid var(--surface-border);
}

.p-menuitem-link {
  text-decoration: none;
  color: var(--text-color);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  transition: background-color 0.2s;
}

.p-menuitem-link:hover {
  background-color: var(--surface-hover);
}

.active-route {
  background-color: var(--primary-color);
  color: white !important;
}

.active-route:hover {
  background-color: var(--primary-600) !important;
}

.user-info {
  display: flex;
  flex-direction: column;
}

:deep(.p-badge) {
  min-width: 1.2rem;
  height: 1.2rem;
  line-height: 1.2rem;
  font-size: 0.75rem;
}

:deep(.p-avatar) {
  background: var(--primary-color) !important;
}

@media (max-width: 960px) {
  .user-info {
    display: none;
  }
}
</style>
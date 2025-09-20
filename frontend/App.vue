<template>
  <div class="app-container">
    <AppHeader v-if="isAuthenticated" />
    
    <main class="main-content p-4">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <Toast />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from './stores/auth'
import AppHeader from './components/AppHeaders.vue'
import Toast from 'primevue/toast'

const authStore = useAuthStore()
const isAuthenticated = computed(() => !!authStore.user)
</script>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  background-color: var(--surface-ground);
}

/* Анимации переходов */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Глобальные стили */
body {
  font-family: var(--font-family);
  background-color: var(--surface-ground);
  color: var(--text-color);
  margin: 0;
  padding: 0;
  height: 100vh;
}

html, body {
  height: 100%;
}

#app {
  height: 100%;
}

/* Исправляем стили PrimeVue */
.p-component {
  font-family: var(--font-family);
}

/* Убедимся что все контейнеры занимают всю высоту */
.min-h-screen {
  min-height: 100vh !important;
}

.surface-ground {
  background: var(--surface-ground) !important;
}
</style>
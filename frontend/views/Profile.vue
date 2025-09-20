<template>
  <div class="profile">
    <h1>Мой профиль</h1>
    <div class="profile-content">
      <div class="profile-info">
        <h3>Информация</h3>
        <p><strong>Имя пользователя:</strong> {{ user?.username }}</p>
        <p><strong>Email:</strong> {{ user?.email }}</p>
        <p v-if="user?.admin === true"><strong>Администратор:</strong> <i class="pi pi-check-circle"></i></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
const authStore = useAuthStore()
const user = computed(() => authStore.user)

</script>

<style scoped>
.profile {
  padding: 20px;
}

.profile-content {
  max-width: 600px;
}

.profile-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.profile-info h3 {
  margin-top: 0;
  color: #333;
}

.profile-info p {
  margin: 10px 0;
  color: #666;
}
</style>
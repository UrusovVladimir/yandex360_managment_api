import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersApi } from '../api/users'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  const fetchUsers = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await usersApi.getAll()
      users.value = response
      // console.log("Информация по юзерам",users)
    } catch (err) {
      error.value = err
      console.error('Error fetching users:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteUser = async (id) => {
    isLoading.value = true
    error.value = null
    
    try {
      await usersApi.delete(id)
      removeUser(id)
    } catch (err) {
      error.value = err
      console.error('Error deleting user:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createUser = async (userData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await usersApi.create(userData)
      addUser(response)
      return response
    } catch (err) {
      error.value = err
      console.error('Error creating user:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateUser = async (id, userData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await usersApi.update(id, userData)
      updateUserInStore(response)
      return response
    } catch (err) {
      error.value = err
      console.error('Error updating user:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Store methods
  const addUser = (user) => {
    const exists = users.value.find(u => u.id === user.id)
    if (!exists) {
      users.value.push(user)
    }
  }

  const removeUser = (userId) => {
    users.value = users.value.filter(user => user.id !== userId)
  }


  const updateUserInStore = (updatedUser) => {
    
    const index = users.value.findIndex(user => user.id === updatedUser.id)

    if (index !== -1) {
      users.value[index] = updatedUser
    } else {
      console.warn("User not found in store:", updatedUser.id)
    }
  }
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    users,
    isLoading,
    error,
    
    // Actions
    fetchUsers,
    deleteUser,
    createUser,
    updateUser,
    
    // Methods
    addUser,
    removeUser,
    updateUserInStore,
    clearError
  }
})
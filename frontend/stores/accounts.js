import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '../api/http'

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  const fetchAccounts = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await http.get('/accounts')
      accounts.value = response
    } catch (err) {
      error.value = err
      console.error('Error fetching accounts:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteAccount = async (id) => {
    isLoading.value = true
    error.value = null
    
    try {
      await http.delete(`/accounts/${id}`)
      removeAccount(id)
    } catch (err) {
      error.value = err
      console.error('Error deleting account:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createAccount = async (accountData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await http.post('/accounts', accountData)
      addAccount(response)
      return response
    } catch (err) {
      error.value = err
      console.error('Error creating account:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Store methods
  const addAccount = (account) => {
    const exists = accounts.value.find(a => a.id === account.id)
    if (!exists) {
      accounts.value.push(account)
    }
  }

  const removeAccount = (accountId) => {
    accounts.value = accounts.value.filter(account => account.id !== accountId)
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    accounts,
    isLoading,
    error,
    
    // Actions
    fetchAccounts,
    deleteAccount,
    createAccount,
    
    // Methods
    addAccount,
    removeAccount,
    clearError
  }
})
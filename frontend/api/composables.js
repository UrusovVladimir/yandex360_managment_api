import { ref } from 'vue'
import { http } from './http'
import { usersApi } from './users'

// Composition API функции для использования существующих API
export const useApi = () => {
  const isLoading = ref(false)
  const error = ref(null)

  const clearError = () => {
    error.value = null
  }

  // Обертка для существующих методов с обработкой состояния
  const withLoading = async (apiCall) => {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await apiCall()
      return result
    } catch (err) {
      error.value = err
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // Прямой доступ к существующим API
    http,
    usersApi,
    
    // Reactive state
    isLoading,
    error,
    clearError,
    
    // Обертки с loading state
    request: (path, options) => withLoading(() => http.request(path, options)),
    get: (path, options) => withLoading(() => http.get(path, options)),
    post: (path, data, options) => withLoading(() => http.post(path, data, options)),
    put: (path, data, options) => withLoading(() => http.put(path, data, options)),
    delete: (path, options) => withLoading(() => http.delete(path, options)),
    
    // Users с loading state
    users: {
      getAll: () => withLoading(() => usersApi.getAll()),
      getById: (id) => withLoading(() => usersApi.getById(id)),
      create: (userData) => withLoading(() => usersApi.create(userData)),
      update: (id, userData) => withLoading(() => usersApi.update(id, userData)),
      delete: (id) => withLoading(() => usersApi.delete(id))
    }
  }
}
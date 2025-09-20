import { defineStore } from 'pinia'
import { ref } from 'vue'
import { socket } from '../socket'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref('')

  const login = async (credentials) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа')
      }
      user.value = data.user
      token.value = data.token
      localStorage.setItem('token', data.token)
      socket.connect()
      
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

// const register = async (userData) => {
//   loading.value = true
//   error.value = ''
  
//   try {
//     const response = await fetch('http://localhost:5050/api/auth/register', {
//       method: 'POST',
//       headers: { 
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(userData)
//     })
    
//     const data = await response.json()
    
//     if (!response.ok) {
//       throw new Error(data.error || 'Ошибка регистрации')
//     }
    
//     user.value = data.user
//     token.value = data.token
//     localStorage.setItem('token', data.token)
//     socket.connect()
    
//     return data
//   } catch (err) {
//     error.value = err.message
//     throw err
//   } finally {
//     loading.value = false
//   }
// }
  const verifyToken = async () => {
    if (!token.value) return false
    
    try {
      const response = await fetch('http://localhost:5050/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
      
      const data = await response.json()
      
      if (data.valid) {
        user.value = data.user
        socket.connect()
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Token verification error:', error)
      logout()
      return false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    socket.disconnect()
  }

  return { 
    user, 
    token, 
    loading, 
    error, 
    login, 
    // register, 
    verifyToken, 
    logout 
  }
})


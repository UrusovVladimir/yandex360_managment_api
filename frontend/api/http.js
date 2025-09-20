import { API_BASE } from "../services/apiEndpoints"

class ApiError extends Error {
  constructor(message, status, responseData) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.responseData = responseData
  }
}

export const http = {
  async request(path, options = {}) {
    try {
      const url = path.startsWith('http') ? path : `${API_BASE}${path}`
      
      const config = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      }

      const response = await fetch(url, config)
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new ApiError('Server returned non-JSON response', response.status, text)
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new ApiError(data.error || 'Request failed', response.status, data)
      }
      
      return data
      
    } catch (error) {
      console.error('HTTP request failed:', error)
      throw error
    }
  },

  async get(path, options = {}) {
    return this.request(path, { method: 'GET', ...options })
  },

  async post(path, data, options = {}) {
    return this.request(path, { 
      method: 'POST', 
      body: JSON.stringify(data),
      ...options 
    })
  },

  async put(path, data, options = {}) {
    return this.request(path, { 
      method: 'PUT', 
      body: JSON.stringify(data),
      ...options 
    })
  },

  async delete(path, options = {}) {
    return this.request(path, { method: 'DELETE', ...options })
  }
}
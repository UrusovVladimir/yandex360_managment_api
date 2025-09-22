import { http } from './http'
import { API_BASE } from '../services/apiEndpoints'


export const usersApi = {
  async getAll() {
    return http.get(`${API_BASE}/users`)
  },

  async getById(id) {
    return http.get(`${API_BASE}/users/${id}`)
  },

  async create(userData) {
    return http.post(`${API_BASE}/users`, userData)
  },

  async update(id, userData) {
    return http.put(`${API_BASE}/users/${id}`, userData)
  },

  async delete(id) {
    return http.delete(`${API_BASE}/users/${id}`)
  }
}
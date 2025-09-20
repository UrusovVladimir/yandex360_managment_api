import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { yandexApiService } from '../services/apiYandexServices'

export function useUserManagement() {
  const toast = useToast()
  const departmentsList = ref([])
  const loadingDepartments = ref(false)

  const loadDepartments = async (orgId) => {
    if (!orgId) return
    
    loadingDepartments.value = true
    try {
      // Добавляем метод в yandexApiService
      const response = await yandexApiService.getDepartments(orgId)
      departmentsList.value = response.departments || response || []
    } catch (error) {
      console.error('Error loading departments:', error)
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось загрузить отделы',
        life: 3000
      })
    } finally {
      loadingDepartments.value = false
    }
  }

  return {
    departmentsList,
    loadingDepartments,
    loadDepartments
  }
}
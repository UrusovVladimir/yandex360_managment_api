<template>
    <Dialog 
      v-model:visible="visible" 
      :header="isEditing ? 'Редактирование пользователя' : 'Создание пользователя'" 
      :style="{ width: '500px' }"
      :modal="true"
    >
      <div v-if="!account" class="loading">
        <ProgressSpinner />
      </div>
  
      <form v-else @submit.prevent="submitForm">
        <!-- Основная информация -->
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="field mb-3">
              <label class="block mb-2">Имя *</label>
              <InputText 
                v-model="formData.name.first" 
                class="w-full" 
                required
                placeholder="Введите имя"
              />
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="field mb-3">
              <label class="block mb-2">Фамилия *</label>
              <InputText 
                v-model="formData.name.last" 
                class="w-full" 
                required
                placeholder="Введите фамилию"
              />
            </div>
          </div>
        </div>
  
        <div class="field mb-3">
          <label class="block mb-2">Отчество</label>
          <InputText 
            v-model="formData.name.middle" 
            class="w-full" 
            placeholder="Введите отчество"
          />
        </div>
  
        <div class="field mb-3">
          <label class="block mb-2">Email *</label>
          <InputText 
            v-model="formData.email" 
            class="w-full" 
            type="email"
            required
            placeholder="Введите email"
          />
        </div>
  
        <div class="field mb-3">
          <label class="block mb-2">Никнейм *</label>
          <InputText 
            v-model="formData.nickname" 
            class="w-full" 
            required
            placeholder="Введите никнейм"
          />
        </div>
  
        <div v-if="!isEditing" class="field mb-3">
          <label class="block mb-2">Пароль *</label>
          <Password 
            v-model="formData.password" 
            class="w-full" 
            :feedback="false"
            toggleMask
            required
            placeholder="Введите пароль"
          />
          <small class="text-500">Минимум 6 символов</small>
        </div>
  
        <!-- Дополнительная информация -->
        <Accordion class="mb-3">
          <AccordionTab header="Дополнительная информация">
            <div class="field mb-3">
              <label class="block mb-2">Должность</label>
              <InputText 
                v-model="formData.position" 
                class="w-full" 
                placeholder="Введите должность"
              />
            </div>
  
            <div class="field mb-3">
              <label class="block mb-2">Отдел</label>
              <Dropdown 
                v-model="selectedDepartmentId" 
                :options="departmentsOptions" 
                optionLabel="name"
                optionValue="id"
                class="w-full" 
                placeholder="Выберите отдел"
                :loading="loadingDepartments"
                :filter="true"
              />
              <small class="text-500">Оставьте пустым для отдела по умолчанию</small>
            </div>
  
            <div class="field mb-3">
              <label class="block mb-2">Статус</label>
              <Dropdown 
                v-model="formData.isEnabled" 
                :options="statusOptions" 
                optionLabel="label"
                optionValue="value"
                class="w-full" 
                placeholder="Выберите статус"
              />
            </div>
          </AccordionTab>
        </Accordion>
      </form>
  
      <template #footer>
        <Button 
          label="Отмена" 
          icon="pi pi-times" 
          @click="visible = false" 
          class="p-button-text"
        />
        <Button 
          :label="isEditing ? 'Сохранить' : 'Создать'" 
          icon="pi pi-check" 
          @click="submitForm" 
          :loading="loading"
        />
      </template>
    </Dialog>
  </template>
  
  <script setup>
  import { ref, reactive, watch, computed } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { yandexApiService } from '../../services/apiYandexServices'
  import { useUserManagement } from '../../composables/useUserManagment'
  
  const props = defineProps({
    visible: Boolean,
    user: Object,
    account: Object
  })
  
  const emit = defineEmits(['update:visible', 'user-saved'])
  
  const toast = useToast()
  const loading = ref(false)
  
  const formData = reactive({
    name: {
      first: '',
      last: '',
      middle: ''
    },
    email: '',
    nickname: '',
    password: '',
    position: '',
    isEnabled: true
  })
  
  // Отдельная переменная для выбранного отдела
  const selectedDepartmentId = ref(null)
  
  const statusOptions = [
    { label: 'Активен', value: true },
    { label: 'Неактивен', value: false }
  ]
  
  const visible = ref(props.visible)
  const isEditing = computed(() => !!props.user)
  
  const { departmentsList, loadingDepartments, loadDepartments } = useUserManagement()
  
  const departmentsOptions = computed(() => {
    return departmentsList.value.map(dept => ({
      id: dept.id,
      name: dept.name || `Отдел ${dept.id}`
    }))
  })
  
  // Загружаем отделы при открытии формы
  watch(() => props.visible, async (newVal) => {
    visible.value = newVal
    if (newVal) {
      if (departmentsList.value.length === 0 && props.account) {
        await loadDepartments(props.account.organization_id)
      }
      
      if (props.user) {
        // Заполняем форму данными пользователя
        resetForm()
        Object.assign(formData, props.user)
        
        // Устанавливаем выбранный отдел
        if (props.user.departmentId) {
          selectedDepartmentId.value = props.user.departmentId
        }
        
        // Обрабатываем поле name
        if (props.user.name && typeof props.user.name === 'object') {
          Object.assign(formData.name, props.user.name)
        } else if (typeof props.user.name === 'string') {
          const parts = props.user.name.split(' ')
          formData.name.first = parts[0] || ''
          formData.name.last = parts[1] || ''
        }
      }
    }
  })
  
  watch(visible, (newVal) => {
    emit('update:visible', newVal)
    if (!newVal) {
      resetForm()
    }
  })
  
  const resetForm = () => {
    formData.name = { first: '', last: '', middle: '' }
    formData.email = ''
    formData.nickname = ''
    formData.password = ''
    formData.position = ''
    formData.isEnabled = true
    selectedDepartmentId.value = null
  }
  
  const validateForm = () => {
    if (!formData.name.first.trim()) {
      toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Имя обязательно', life: 3000 })
      return false
    }
    
    if (!formData.name.last.trim()) {
      toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Фамилия обязательна', life: 3000 })
      return false
    }
    
    if (!formData.email.trim()) {
      toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Email обязателен', life: 3000 })
      return false
    }
    
    if (!formData.nickname.trim()) {
      toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Никнейм обязателен', life: 3000 })
      return false
    }
    
    if (!isEditing.value && !formData.password) {
      toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Пароль обязателен', life: 3000 })
      return false
    }
    
    if (!isEditing.value && formData.password.length < 6) {
      toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Пароль должен содержать минимум 6 символов', life: 3000 })
      return false
    }
    
    return true
  }
  
  // Подготавливаем данные для отправки
  const prepareFormData = () => {
    const data = {
      name: {
        first: formData.name.first.trim(),
        last: formData.name.last.trim(),
        middle: formData.name.middle.trim()
      },
      email: formData.email.trim(),
      nickname: formData.nickname.trim(),
      isEnabled: formData.isEnabled
    }
  
    // Добавляем пароль только при создании
    if (!isEditing.value) {
      data.password = formData.password
    }
  
    // Добавляем опциональные поля только если они заполнены
    if (formData.position.trim()) {
      data.position = formData.position.trim()
    }
  
    // Добавляем departmentId только если выбран валидный отдел
    if (selectedDepartmentId.value && selectedDepartmentId.value > 0) {
      data.departmentId = selectedDepartmentId.value
    }
  
    // Удаляем пустые поля
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === undefined || data[key] === '') {
        delete data[key]
      }
    })
  
    // Особо обрабатываем объект name
    if (data.name) {
      Object.keys(data.name).forEach(key => {
        if (!data.name[key]) {
          delete data.name[key]
        }
      })
      // Если объект name пустой - удаляем его
      if (Object.keys(data.name).length === 0) {
        delete data.name
      }
    }
  
    return data
  }
  
  const submitForm = async () => {
    if (!props.account || !validateForm()) return
  
    loading.value = true
    try {
      const preparedData = prepareFormData()
    //   console.log('Sending data to API:', preparedData)
  
      if (isEditing.value) {
        await yandexApiService.updateUser(
          props.account.organization_id,
          props.user.id,
          preparedData
        )
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Пользователь обновлен',
          life: 3000
        })
      } else {
        await yandexApiService.createUser(
          props.account.organization_id,
          preparedData
        )
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Пользователь создан',
          life: 3000
        })
      }
      
      emit('user-saved')
      visible.value = false
      
    } catch (error) {
      console.error('Error saving user:', error)
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: error.response?.data?.message || error.message || 'Не удалось сохранить пользователя',
        life: 5000
      })
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <style scoped>
  :deep(.p-password) {
    width: 100%;
  }
  
  :deep(.p-password input) {
    width: 100%;
  }
  
  .loading {
    display: flex;
    justify-content: center;
    padding: 2rem;
  }
  </style>
<template>
    <div class="api-results">
      <Card>
        <template #title>
          <div class="flex align-items-center justify-content-between">
            <div>
              <i class="pi pi-list mr-2"></i>
              Результаты операций
              <Tag :value="results.length" class="ml-2" />
            </div>
            <Button 
              v-if="results.length > 0"
              icon="pi pi-trash" 
              label="Очистить" 
              @click="clearResults"
              class="p-button-text p-button-sm"
            />
          </div>
        </template>
        <template #content>
          <div v-if="results.length === 0" class="empty-results">
            <i class="pi pi-inbox text-6xl text-400 mb-3"></i>
            <p class="text-500">Результаты операций появятся здесь</p>
          </div>
  
          <div v-else class="results-list">
            <Accordion :activeIndex="0" class="results-accordion">
              <AccordionTab v-for="(result, index) in results" :key="result.id">
                <template #header>
                  <div class="result-header">
                    <div class="result-info">
                      <i :class="getOperationIcon(result.operation)" class="mr-2"></i>
                      <span class="result-operation">{{ getOperationTitle(result.operation) }}</span>
                      <Tag 
                        :severity="getStatusSeverity(result.status)" 
                        :value="result.status" 
                        class="ml-2"
                      />
                    </div>
                    <div class="result-time">
                      {{ formatTime(result.created_at || result.timestamp) }}
                    </div>
                  </div>
                </template>
                
                <div class="result-content">
                  <!-- ВЕРНУЛИ ДВУХКОЛОНОЧНЫЙ LAYOUT -->
                  <div class="grid">
                    <!-- Данные запроса -->
                    <div class="col-12 lg:col-6">
                      <h4><i class="pi pi-send mr-2"></i>Данные запроса:</h4>
                      <div class="json-container">
                        <pre class="json-display">{{ formatJson(result.request_data || result.requestData) }}</pre>
                      </div>
                    </div>
                    
                    <!-- Ответ сервера -->
                    <div class="col-12 lg:col-6">
                      <h4><i class="pi pi-database mr-2"></i>Ответ сервера:</h4>
                      <div 
                        class="json-container"
                        :class="{ 
                          'success-response': result.status === 'success', 
                          'error-response': result.status === 'error' 
                        }"
                      >
                        <pre class="json-display">
                          {{ formatServerResponse(result.response_data || result.responseData) }}
                        </pre>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Сообщение об ошибке (отдельно под двумя колонками) -->
                  <div v-if="result.error_message || result.error" class="error-details mt-4">
                    <h4><i class="pi pi-exclamation-triangle mr-2"></i>Ошибка:</h4>
                    <Message severity="error" :closable="false">
                      {{ result.error_message || result.error }}
                    </Message>
                  </div>

                  <!-- Дополнительная информация -->
                  <div v-if="result.endpoint || result.duration" class="additional-info mt-4">
                    <h4><i class="pi pi-info-circle mr-2"></i>Дополнительно:</h4>
                    <div class="grid">
                      <div v-if="result.endpoint" class="col-12 md:col-6">
                        <strong>Endpoint:</strong> {{ result.endpoint }}
                      </div>
                      <div v-if="result.duration" class="col-12 md:col-6">
                        <strong>Длительность:</strong> {{ result.duration }} ms
                      </div>
                      <div v-if="result.account_id" class="col-12 md:col-6">
                        <strong>Account ID:</strong> {{ result.account_id }}
                      </div>
                    </div>
                  </div>

                  <!-- Кнопки действий -->
                  <div class="result-actions mt-4">
                    <Button 
                      icon="pi pi-copy" 
                      label="Копировать JSON" 
                      @click="copyToClipboard(prepareDataForExport(result))"
                      class="p-button-text"
                    />
                    <Button 
                      icon="pi pi-download" 
                      label="Экспорт в файл" 
                      @click="exportJson(result)"
                      class="p-button-text ml-2"
                    />
                    <Button 
                      v-if="hasDetailedData(result)"
                      icon="pi pi-eye" 
                      label="Сырые данные" 
                      @click="toggleRawView(result)"
                      class="p-button-text ml-2"
                    />
                  </div>
                </div>
              </AccordionTab>
            </Accordion>
          </div>
        </template>
      </Card>
  
      <!-- Диалог для детального просмотра -->
      <Dialog 
        v-model:visible="showDetailDialog" 
        :header="detailTitle" 
        :style="{ width: '700px' }"
        :modal="true"
      >
        <pre class="json-detail-display">{{ detailContent }}</pre>
        <template #footer>
          <Button label="Закрыть" @click="showDetailDialog = false" />
        </template>
      </Dialog>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'    
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'

const toast = useToast()

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['clearResults'])

const showDetailDialog = ref(false)
const detailTitle = ref('')
const detailContent = ref('')
const expandedItems = reactive({})

// Функция: проверяет есть ли данные
const hasData = (data) => {
  return data !== null && data !== undefined && data !== ''
}

// Функция: форматирует ответ сервера (только данные, без ошибок)
const formatServerResponse = (responseData) => {
  if (hasData(responseData)) {
    return formatJson(responseData)
  } else {
    return 'Нет данных ответа'
  }
}

// Функция: подготавливает данные для экспорта
const prepareDataForExport = (result) => {
  return {
    operation: result.operation,
    timestamp: result.created_at || result.timestamp,
    request: result.request_data || result.requestData,
    response: result.response_data || result.responseData,
    error: result.error_message || result.error,
    endpoint: result.endpoint,
    duration: result.duration,
    status: result.status
  }
}

// Функция: проверяет есть ли детальные данные для просмотра
const hasDetailedData = (result) => {
  return hasData(result.response_data || result.responseData) || 
         hasData(result.request_data || result.requestData) ||
         hasData(result.error_message || result.error)
}

const formatJson = (data) => {
  if (!hasData(data)) return 'Нет данных'
  try {
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2)
    }
    return String(data)
  } catch {
    return String(data)
  }
}

const isComplexObject = (data) => {
  if (!hasData(data) || typeof data !== 'object') return false
  return Object.keys(data).length > 3 || Object.values(data).some(val => typeof val === 'object')
}

const formatComplexDataForTable = (data) => {
  if (!hasData(data) || typeof data !== 'object') {
    return [{ key: 'data', type: typeof data, value: String(data) }]
  }
  
  return Object.entries(data).map(([key, value]) => ({
    key,
    type: Array.isArray(value) ? 'array' : typeof value,
    value: value,
    expanded: expandedItems[key] || false
  }))
}

const getObjectSummary = (obj) => {
  if (Array.isArray(obj)) {
    return `Массив [${obj.length} элементов]`
  } else if (obj && typeof obj === 'object') {
    return `Объект {${Object.keys(obj).length} свойств}`
  }
  return String(obj)
}

const expandItem = (item) => {
  detailTitle.value = `Детали: ${item.key}`
  detailContent.value = formatJson(item.value)
  showDetailDialog.value = true
}

const toggleRawView = (result) => {
  detailTitle.value = `Сырые данные: ${getOperationTitle(result.operation)}`
  detailContent.value = formatJson(prepareDataForExport(result))
  showDetailDialog.value = true
}

const getOperationIcon = (operation) => {
  const icons = {
    'get2FAStatus': 'pi pi-lock',
    'getSecuritySettings': 'pi pi-shield',
    'getUsers': 'pi pi-users',
    'createUser': 'pi pi-user-plus',
    'checkToken': 'pi pi-key',
    'default': 'pi pi-cog'
  }
  return icons[operation] || icons.default
}

const getOperationTitle = (operation) => {
  const titles = {
    'get2FAStatus': 'Статус 2FA',
    'getSecuritySettings': 'Настройки безопасности',
    'getUsers': 'Получение пользователей',
    'createUser': 'Создание пользователя',
    'checkToken': 'Проверка токена',
    'default': operation
  }
  return titles[operation] || titles.default
}

const getStatusSeverity = (status) => {
  const severities = {
    'success': 'success',
    'error': 'danger',
    'pending': 'warning',
    'default': 'info'
  }
  return severities[status] || severities.default
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const clearResults = () => {
  emit('clearResults')
}

const copyToClipboard = async (data) => {
  try {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    await navigator.clipboard.writeText(text)
    toast.add({
      severity: 'success',
      summary: 'Скопировано',
      detail: 'Данные скопированы в буфер обмена',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось скопировать данные',
      life: 3000
    })
  }
}

const exportJson = (result) => {
  const data = prepareDataForExport(result)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `api-result-${result.operation}-${result.created_at || result.timestamp}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.api-results {
  width: 100%;
}

.empty-results {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 1rem;
}

.result-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.result-operation {
  font-weight: 600;
}

.result-time {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.result-content {
  padding: 1rem 0;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.json-container {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  max-height: 400px;
  overflow-y: auto;
}

.json-display {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
}

.json-detail-display {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 6px;
  max-height: 60vh;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.success-response {
  border-left: 4px solid var(--green-500);
}

.error-response {
  border-left: 4px solid var(--red-500);
}

.json-summary {
  color: var(--text-color-secondary);
  font-style: italic;
}

.json-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

:deep(.results-accordion .p-accordion-header-link) {
  padding: 1rem 1.25rem;
  background: var(--surface-section);
}

:deep(.results-accordion .p-accordion-content) {
  padding: 1.25rem;
  background: var(--surface-ground);
}

:deep(.p-datatable) {
  font-size: 0.875rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
}

@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .result-time {
    font-size: 0.75rem;
  }
  
  .result-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .json-container {
    max-height: 300px;
    padding: 0.75rem;
  }
  
  .json-display {
    font-size: 0.75rem;
  }
}
</style>
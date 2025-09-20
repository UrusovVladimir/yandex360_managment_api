import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import ConfirmDialog from 'primevue/confirmdialog'
import ConfirmationService from 'primevue/confirmationservice'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import FileUpload from 'primevue/fileupload'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'

// Импорты компонентов PrimeVue
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Toast from 'primevue/toast'
import Menubar from 'primevue/menubar'
import Badge from 'primevue/badge'
import Menu from 'primevue/menu'
import ProgressBar from 'primevue/progressbar'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Textarea from 'primevue/textarea'

// Стили PrimeVue
import 'primevue/resources/themes/lara-light-indigo/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue)
app.use(ToastService)
app.use(ConfirmationService) // Добавляем сервис подтверждения

// Глобальная регистрация компонентов PrimeVue
app.component('Dropdown', Dropdown)
app.component('Textarea', Textarea)
app.component('Button', Button)
app.component('InputText', InputText)
app.component('Password', Password)
app.component('Card', Card)
app.component('Avatar', Avatar)
app.component('Divider', Divider)
app.component('Message', Message)
app.component('Toast', Toast)
app.component('Menubar', Menubar)
app.component('Badge', Badge)
app.component('Menu', Menu)
app.component('ProgressBar', ProgressBar)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Dialog', Dialog)
app.directive('tooltip', Tooltip)
app.component('Accordion', Accordion)
app.component('AccordionTab', AccordionTab)
app.component('Checkbox',Checkbox)
app.component('InputNumber',InputNumber)


// НОВЫЕ КОМПОНЕНТЫ - добавляем эти строки:
app.component('ConfirmDialog', ConfirmDialog)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Tag', Tag)
app.component('FileUpload', FileUpload)
app.component('TabView', TabView)
app.component('TabPanel', TabPanel)

app.mount('#app')
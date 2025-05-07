import './assets/main.css'
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'vue-toast-notification/dist/theme-sugar.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './store'
import PrimeVue from 'primevue/config'
import ToastPlugin from 'vue-toast-notification'
import axios from 'axios'
import i18n from './i18n'
import { useAuthStore } from './store/auth'
import { useAdminStore } from './store/admin'
import { setupBFCacheHandlers } from './utils/bfcacheHandler'

// Make axios available globally for bfcache handler
window.axios = axios

// Set base URL for axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const app = createApp(App)

// Use plugins
app.use(router)
app.use(pinia)
app.use(PrimeVue)
app.use(ToastPlugin)
app.use(i18n)

// Mount app
app.mount('#app')

// Initialize auth stores
console.log('Initializing auth stores...')

const authStore = useAuthStore()
console.log('User auth store created, authenticated:', authStore.isAuthenticated)
authStore.init()
console.log('User auth store initialized')

const adminStore = useAdminStore()
console.log('Admin store created, authenticated:', adminStore.isAuthenticated)
adminStore.init()
console.log('Admin store initialized')

// Set admin token in axios headers if available
const adminToken = localStorage.getItem('admin_token')
if (adminToken) {
  console.log('Setting admin token in axios defaults')
  axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`
}

// Setup BFCache handlers to prevent "Unchecked runtime.lastError" messages
setupBFCacheHandlers()

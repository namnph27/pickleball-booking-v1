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
import { useSocketService } from './services/SocketService'

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

// Không đặt admin token trong axios defaults để tránh xung đột
// Thay vào đó, mỗi component sẽ đặt token trong từng request cụ thể
const adminToken = localStorage.getItem('admin_token')
if (adminToken) {
  console.log('Admin token exists, but not setting in axios defaults')
  // Không đặt token trong axios.defaults.headers.common
}

// Setup BFCache handlers to prevent "Unchecked runtime.lastError" messages
setupBFCacheHandlers()

// Initialize Socket.io connection if user is authenticated
// Không cần gọi cleanup ở đây vì không có component lifecycle
if (authStore.isAuthenticated) {
  try {
    const socketService = useSocketService()
    socketService.initializeSocket()
    console.log('Socket.io service initialized')
  } catch (error) {
    console.error('Error initializing Socket.io service:', error)
  }
}

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import type { LoginCredentials } from '../../types';

const router = useRouter();
const authStore = useAuthStore();

const credentials = reactive<LoginCredentials>({
  email: '',
  password: ''
});

const loading = ref(false);
const errorMessage = ref('');

const login = async () => {
  if (!credentials.email || !credentials.password) {
    errorMessage.value = 'Please enter both email and password';
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    await authStore.login(credentials);
    router.push('/');
  } catch (error) {
    if (typeof error === 'string') {
      errorMessage.value = error;
    } else {
      errorMessage.value = 'Login failed. Please check your credentials.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Login</h1>
      
      <form @submit.prevent="login" class="auth-form">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="credentials.email" 
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="credentials.password" 
            placeholder="Enter your password"
            required
          />
        </div>
        
        <div class="form-actions">
          <button 
            type="submit" 
            class="btn-primary" 
            :disabled="loading"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </div>
        
        <div class="auth-links">
          <p>Don't have an account? <router-link to="/register">Register</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.auth-card {
  background-color: var(--white);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 2rem;
  width: 100%;
  max-width: 450px;
}

.auth-card h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--primary-color);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text-color);
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid var(--medium-gray);
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-actions {
  margin-top: 1rem;
}

.form-actions button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
}

.auth-links {
  text-align: center;
  margin-top: 1rem;
}

.auth-links a {
  color: var(--primary-color);
  font-weight: 500;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.btn-primary {
  background-color: var(--primary-color);
  color: var(--white);
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #3d8b40;
}

.btn-primary:disabled {
  background-color: var(--medium-gray);
  cursor: not-allowed;
}
</style>

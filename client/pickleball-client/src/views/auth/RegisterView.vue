<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import type { RegisterData } from '../../types';

const router = useRouter();
const authStore = useAuthStore();

const userData = reactive<RegisterData>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone: '',
  role: 'customer'
});

const loading = ref(false);
const errorMessage = ref('');

const register = async () => {
  if (userData.password !== userData.password_confirmation) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    await authStore.register(userData);
    router.push('/');
  } catch (error) {
    if (typeof error === 'string') {
      errorMessage.value = error;
    } else {
      errorMessage.value = 'Registration failed. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Register</h1>
      
      <form @submit.prevent="register" class="auth-form">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div class="form-group">
          <label for="name">Full Name</label>
          <input 
            type="text" 
            id="name" 
            v-model="userData.name" 
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="userData.email" 
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="userData.phone" 
            placeholder="Enter your phone number"
          />
        </div>
        
        <div class="form-group">
          <label for="role">Account Type</label>
          <select id="role" v-model="userData.role">
            <option value="customer">Customer</option>
            <option value="court_owner">Court Owner</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="userData.password" 
            placeholder="Enter your password"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password_confirmation">Confirm Password</label>
          <input 
            type="password" 
            id="password_confirmation" 
            v-model="userData.password_confirmation" 
            placeholder="Confirm your password"
            required
          />
        </div>
        
        <div class="form-actions">
          <button 
            type="submit" 
            class="btn-primary" 
            :disabled="loading"
          >
            {{ loading ? 'Registering...' : 'Register' }}
          </button>
        </div>
        
        <div class="auth-links">
          <p>Already have an account? <router-link to="/login">Login</router-link></p>
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
  padding: 2rem 0;
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

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid var(--medium-gray);
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
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

<template>
  <div class="api-test">
    <h2>API Connection Test</h2>
    <button @click="testApi" class="test-button">Test API Connection</button>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="result" class="result">
      <h3>API Response:</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const loading = ref(false);
const error = ref('');
const result = ref(null);

const testApi = async () => {
  loading.value = true;
  error.value = '';
  result.value = null;
  
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courts`);
    result.value = response.data;
    console.log('API Response:', response.data);
  } catch (err: any) {
    console.error('API Error:', err);
    error.value = err.message || 'An error occurred';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.api-test {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.test-button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 20px;
}

.test-button:hover {
  background-color: #45a049;
}

.loading {
  margin: 10px 0;
  color: #666;
}

.error {
  margin: 10px 0;
  color: #f44336;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background-color: #e8f5e9;
  border-radius: 4px;
  overflow: auto;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

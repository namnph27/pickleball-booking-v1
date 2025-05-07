<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.back();
};

const goHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="error-container">
    <div class="error-content">
      <h1>403</h1>
      <h2>Access Forbidden</h2>
      <p>You don't have permission to access this page.</p>
      <div class="error-actions">
        <button @click="goBack" class="btn-secondary">Go Back</button>
        <button @click="goHome" class="btn-primary">Go Home</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  text-align: center;
}

.error-content {
  max-width: 500px;
}

.error-content h1 {
  font-size: 6rem;
  color: var(--accent-color);
  margin: 0;
}

.error-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-content p {
  color: var(--dark-gray);
  margin-bottom: 2rem;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
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

.btn-secondary {
  background-color: transparent;
  color: var(--text-color);
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--medium-gray);
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background-color: var(--light-gray);
  border-color: var(--dark-gray);
}
</style>

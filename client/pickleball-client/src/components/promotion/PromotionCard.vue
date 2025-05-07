<template>
  <div class="promotion-card">
    <div class="promotion-header">
      <div class="promotion-badge">{{ promotion.discount_percent }}% OFF</div>
      <div class="promotion-dates">
        {{ formatDate(promotion.start_date) }} - {{ formatDate(promotion.end_date) }}
      </div>
    </div>
    
    <div class="promotion-content">
      <div class="promotion-code">{{ promotion.code }}</div>
      <div class="promotion-description">{{ promotion.description }}</div>
    </div>
    
    <div class="promotion-footer">
      <Button 
        :label="$t('promotion.copy')" 
        icon="pi pi-copy" 
        class="p-button-outlined p-button-sm" 
        @click="copyCode"
      />
      <Button 
        :label="$t('promotion.apply')" 
        icon="pi pi-check" 
        class="p-button-sm" 
        @click="$emit('apply', promotion.code)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import { formatDate } from '@/utils/formatters';

const props = defineProps<{
  promotion: {
    id: number;
    code: string;
    description: string;
    discount_percent: number;
    start_date: string;
    end_date: string;
  };
}>();

const emit = defineEmits<{
  (e: 'apply', code: string): void;
}>();

const toast = useToast();

const copyCode = () => {
  navigator.clipboard.writeText(props.promotion.code)
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Promotion code copied to clipboard',
        life: 3000
      });
    })
    .catch(() => {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy promotion code',
        life: 3000
      });
    });
};
</script>

<style scoped>
.promotion-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

.promotion-header {
  background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.promotion-badge {
  font-size: 1.2rem;
  font-weight: bold;
}

.promotion-dates {
  font-size: 0.8rem;
  opacity: 0.8;
}

.promotion-content {
  padding: 15px;
}

.promotion-code {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  padding: 10px;
  margin: 10px 0;
  background-color: #f5f5f5;
  border-radius: 4px;
  letter-spacing: 2px;
}

.promotion-description {
  margin-top: 10px;
  color: #666;
  font-size: 0.9rem;
}

.promotion-footer {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #eee;
}
</style>

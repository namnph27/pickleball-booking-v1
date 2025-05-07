<template>
  <div class="payment-history-view">
    <div class="container">
      <PaymentHistory />
    </div>
  </div>
</template>

<script setup lang="ts">
import PaymentHistory from '@/components/payment/PaymentHistory.vue';
</script>

<style scoped>
.payment-history-view {
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

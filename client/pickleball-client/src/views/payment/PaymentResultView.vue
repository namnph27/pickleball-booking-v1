<template>
  <div class="payment-result-view">
    <div class="container">
      <PaymentResult />
    </div>
  </div>
</template>

<script setup lang="ts">
import PaymentResult from '@/components/payment/PaymentResult.vue';
</script>

<style scoped>
.payment-result-view {
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}
</style>

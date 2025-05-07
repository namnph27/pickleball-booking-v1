<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const navigateToCourts = () => {
  router.push('/courts');
};
</script>

<template>
  <div class="home-container">
    <section class="hero">
      <div class="hero-content">
        <h1>Find and Book Pickleball Courts</h1>
        <p>Join the fastest growing sport in the world. Book courts, find players, and improve your game.</p>
        <button @click="navigateToCourts" class="btn-primary">Find Courts</button>
      </div>
      <div class="hero-image">
        <!-- Placeholder for hero image -->
        <div class="image-placeholder">
          <i class="pi pi-image" style="font-size: 3rem;"></i>
          <p>Pickleball Court Image</p>
        </div>
      </div>
    </section>

    <section class="features">
      <h2>Why Choose Our Platform?</h2>
      <div class="feature-cards">
        <div class="feature-card">
          <i class="pi pi-search"></i>
          <h3>Easy Search</h3>
          <p>Find courts near you with our advanced search filters.</p>
        </div>
        <div class="feature-card">
          <i class="pi pi-calendar"></i>
          <h3>Simple Booking</h3>
          <p>Book courts with just a few clicks and manage your reservations.</p>
        </div>
        <div class="feature-card">
          <i class="pi pi-users"></i>
          <h3>Skill Matching</h3>
          <p>Join courts that match your skill level for better games.</p>
        </div>
        <div class="feature-card">
          <i class="pi pi-star"></i>
          <h3>Reward Points</h3>
          <p>Earn points with every booking and redeem for discounts.</p>
        </div>
      </div>
    </section>

    <section class="how-it-works">
      <h2>How It Works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>Create an Account</h3>
          <p>Sign up as a player or court owner in minutes.</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>Find a Court</h3>
          <p>Search for available courts by location, time, or skill level.</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>Book & Play</h3>
          <p>Reserve your spot, make payment, and enjoy your game!</p>
        </div>
      </div>
    </section>

    <section class="cta">
      <div class="cta-content">
        <h2>Ready to Play?</h2>
        <p>Join thousands of pickleball enthusiasts on our platform.</p>
        <div class="cta-buttons">
          <button @click="navigateToCourts" class="btn-primary">Find Courts</button>
          <router-link to="/register" class="btn-secondary">Sign Up</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

/* Hero Section */
.hero {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.hero-content {
  flex: 1;
}

.hero-content h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.hero-content p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: var(--dark-gray);
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-placeholder {
  width: 100%;
  height: 300px;
  background-color: var(--medium-gray);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  color: var(--dark-gray);
}

/* Features Section */
.features {
  text-align: center;
}

.features h2 {
  margin-bottom: 2rem;
  font-size: 2rem;
  color: var(--text-color);
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: var(--white);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: var(--shadow);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card i {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: var(--text-color);
}

.feature-card p {
  color: var(--dark-gray);
}

/* How It Works Section */
.how-it-works {
  text-align: center;
}

.how-it-works h2 {
  margin-bottom: 2rem;
  font-size: 2rem;
  color: var(--text-color);
}

.steps {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-number {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: var(--white);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.step h3 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.step p {
  color: var(--dark-gray);
}

/* CTA Section */
.cta {
  background-color: var(--primary-color);
  padding: 3rem;
  border-radius: 8px;
  text-align: center;
  color: var(--white);
}

.cta h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.cta p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

/* Buttons */
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

.cta .btn-primary {
  background-color: var(--white);
  color: var(--primary-color);
}

.cta .btn-primary:hover {
  background-color: #f0f0f0;
}

.btn-secondary {
  background-color: transparent;
  color: var(--white);
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--white);
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    flex-direction: column;
  }
  
  .steps {
    flex-direction: column;
  }
  
  .cta {
    padding: 2rem;
  }
}
</style>

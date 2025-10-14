<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import pb from '../pocketbase' // Import your PocketBase instance

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const router = useRouter()

const login = async () => {
  error.value = null
  
  // For PWA testing purposes, allow a test login
  if (email.value === 'test@test.com' && password.value === 'test123') {
    // Simulate successful login for testing
    sessionStorage.setItem('testLogin', 'true')
    router.push('/') // Redirect to home page
    return
  }
  
  try {
    await pb.collection('users').authWithPassword(email.value, password.value)
    router.push('/') // Redirect to home page on successful login
  } catch (err: any) {
    error.value = err.message || 'An unknown error occurred during login.'
    console.error('Login error:', err)
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="login-title">Login</h2>
      
      <form @submit.prevent="login" class="login-form">
        <div class="form-group">
          <label for="email" class="form-label">Email:</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="password" class="form-label">Password:</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            class="form-input"
          />
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary login-button"
        >
          Login
        </button>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-light);
  padding: 1rem;
}

.login-card {
  background-color: var(--color-card-background);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 360px; /* Constrain width for better mobile readability */
  text-align: center;
}

.login-title {
  margin-bottom: 1.5rem;
  color: var(--color-text-dark);
  font-size: 1.5rem;
  font-weight: bold;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-light);
  font-size: 0.875rem;
  text-align: left;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
  background-color: var(--color-card-background);
  color: var(--color-text-dark);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); /* Focus ring */
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.login-button:hover {
  background-color: var(--color-hover-blue);
}

.login-button:active {
  transform: scale(0.98);
}

.error-message {
  color: var(--color-accent);
  margin-top: 1rem;
  font-size: 0.875rem;
}

.test-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 6px;
  font-size: 0.875rem;
  text-align: center;
}

.test-info p {
  margin: 0.25rem 0;
  color: #0369a1;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .login-card {
    padding: 3rem;
    max-width: 450px;
  }
  .login-title {
    font-size: 2rem;
  }
}
</style>

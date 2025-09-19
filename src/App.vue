<script setup lang="ts">
import { useRouter } from 'vue-router'
import pb from './pocketbase' // Import PocketBase instance

const router = useRouter()

const logout = () => {
  pb.authStore.clear()
  router.push('/login')
}

// Check auth status on app load or route change
router.isReady().then(() => {
  if (router.currentRoute.value.meta.requiresAuth && !pb.authStore.isValid) {
    // Allow for testing
    const isTestLogin = sessionStorage.getItem('testLogin') === 'true'
    if (!isTestLogin) {
      router.push('/login')
    }
  }
})
</script>

<template>
  <div id="app-container">
    <nav class="app-header">
      
      <h1 class="app-title">Planilha Eh Tudo</h1>

    </nav>

    <main class="app-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background-light);
}

.app-header {
  background-color: var(--color-card-background);
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.app-title {
  font-size: 1.25rem; /* Mobile first */
  font-weight: bold;
  color: var(--color-text-dark);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  color: var(--color-primary);
  text-decoration: none;
  padding: 0.5rem 0.25rem; /* Adjust padding for mobile */
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--color-hover-blue);
  text-decoration: underline;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem; /* Smaller for mobile */
  font-weight: 500;
  transition: background-color 0.2s ease, transform 0.1s ease;
  white-space: nowrap;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-hover-blue);
}

.btn-danger {
  background-color: var(--color-accent);
  color: white;
}

.btn-danger:hover {
  background-color: var(--color-hover-red);
}

.app-content {
  flex-grow: 1;
  padding: 1rem;
  /* Adjust max-width for larger screens if needed, but start full-width for mobile */
}

@media (min-width: 768px) {
  .app-title {
    font-size: 1.75rem;
  }
  .btn {
    font-size: 1rem;
    padding: 0.75rem 1.25rem;
  }
  .app-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
  }
}
</style>

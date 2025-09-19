import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import LoginPage from './components/LoginPage.vue'
import HomePage from './components/HomePage.vue' // We will create this next
import pb from './pocketbase' // Import PocketBase instance

const routes = [
  { path: '/', component: HomePage, meta: { requiresAuth: true } },
  { path: '/login', component: LoginPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !pb.authStore.isValid) {
    next('/login')
  } else {
    next()
  }
})

createApp(App).use(router).mount('#app')

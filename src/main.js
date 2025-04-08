import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from "pinia"
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'
import { createWebHistory, createRouter } from 'vue-router'

import HomeView from './HomeView.vue'
import Bitter from './Bitter.vue'

const routes = [
    { path: '/', component: HomeView, meta: { title: "Bitter · Room Select" } },
    { path: '/local', component: Bitter, meta: { title: "Bitter" }  },
    { path: '/a', component: Bitter, meta: { title: "Bitter · Room A" }  },
    { path: '/b', component: Bitter, meta: { title: "Bitter · Room B" }  },
    { path: '/c', component: Bitter, meta: { title: "Bitter · Room C" }  },
    { path: '/d', component: Bitter, meta: { title: "Bitter · Room D" }  },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// router/index.js or main.js depending on where you set up the router
router.beforeEach((to, from, next) => {
  const defaultTitle = 'My App'; // fallback title
  document.title = to.meta.title || defaultTitle;
  next();
});

const pinia = createPinia()
pinia.use(piniaPluginPersistedState)
createApp(App).use(pinia).use(router).mount('#app')

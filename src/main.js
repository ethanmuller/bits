import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from "pinia"
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'
import { createWebHashHistory, createRouter } from 'vue-router'

import RoomList from './RoomList.vue'
import Bitter from './Bitter.vue'

const routes = [
    { path: '/', component: RoomList, meta: { title: "Bitter · Room Select" } },
    // { path: '/local', component: Bitter, meta: { title: "Bitter" }  },
    { path: '/a', component: Bitter, meta: { title: "Bitter · Room A" }  },
    { path: '/b', component: Bitter, meta: { title: "Bitter · Room B" }  },
    { path: '/c', component: Bitter, meta: { title: "Bitter · Room C" }  },
    { path: '/d', component: Bitter, meta: { title: "Bitter · Room D" }  },
    {
      // Catch all unmatched routes
      path: '/:pathMatch(.*)*',
      redirect: '/'
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

// router/index.js or main.js depending on where you set up the router
router.beforeEach((to, from, next) => {
  const defaultTitle = 'Bitter'; // fallback title
  document.title = to.meta.title || defaultTitle;
  next();
});

const pinia = createPinia()
pinia.use(piniaPluginPersistedState)
createApp(App).use(pinia).use(router).mount('#app')

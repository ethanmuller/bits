import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'

app.use(createPinia())

const app = createApp(App).mount('#app')

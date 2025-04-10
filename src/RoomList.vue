<script setup>
  import { usePxStore } from './stores/PxStore.js'
  import { ref, onMounted, onUnmounted } from 'vue'
  import { rooms as roomData } from './rooms'

  const store = usePxStore()

  const roomStatus = ref([]);

  onMounted(async () => {
    await store.initializeSocket();
    setupSocketEvents();
  })

  onUnmounted(() => {
    store.disconnectSocket()
  })

  function setupSocketEvents() {
    store.socket.on('room status', (roomData) => {
      roomStatus.value = roomData;
    });
  }

</script>
<template>
  <div class="wrapper">
    <nav>
      <div v-for="room in Object.entries(roomData)">
        <RouterLink :to="room[0]">
          <div class="swatch" :style="{ background: room[1].theme.bg }">
            <span :style="{ background: room[1].theme.fg }"></span>
            <span :style="{ background: room[1].theme.hl }"></span>
          </div>
          <span>{{room[1].name}}</span>
          <span class="info">👤 {{roomStatus[room[0]]}}</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.wrapper {
  max-width: 480px;
  margin: 0 auto;
}

nav {
  font-family: monospace;
  font-size: 0.7rem;
}

nav a {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1em;
  align-items: center;
  padding: 2rem 2rem;
  margin: 3rem;
  background: #eee;
  transition: .7s all ease-out;
  box-shadow: 5.63px -5.63px 10.03px #ffffffc2, 1.04px -1.04px 3.62px #ffffffb3, -45px 45px 80px #00000012, -13.57px 13.5662px 24.1177px #00000007, -5.63px 5.6347px 10.0172px #0000000c, -2.04px 2.03796px 2.62304px #0000000d, -1.04px 1.03796px 3px #0000000d, inset -1px 1px 3px #0000, inset 1px -1px 3px #fff0;
  border-radius: 12px;
  text-decoration: none;
}

nav a:hover {
  transition-duration: 0.3s;
  background: #f3f3f3;
  box-shadow: 4px -4px 8px #ffffffc2,
    1.04px -1.04px 2.62px #ffffffb3,
    -7px 7px 20px #00000012,
    -10.57px 10.5662px 7px #00000007,
    -3.63px 3.6347px 2.0172px #0000000c,
    -1.04px 1.03796px 1.62304px #0000000d,
    -0.2px 0.2px 1px #0000000d,
    inset -1px 1px 3px #0000,
    inset 1px -1px 3px #fff0;
}

nav a:active {
  transition-duration: 0s;
  background: #eaeaea;
  box-shadow: 0 0 #ffffffc2, 0 0 #ffffffb3, 0 0 #00000012, 0 0 #00000007, 0 0 #0000000c, 0 0 #0000000d, 0 0 #0000000d, inset -1px 1px 3px #0000001a, inset 1px -1px 3px #fff3;
}

nav .info {
  color: #777;
}

.swatch {
  display: flex;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  padding: 0;

  width: 2rem;
  height: 2rem;

  margin: 0.5em;
}
.swatch span {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  transition: all 100ms;
  transform-origin: 50% 50%;
}

.swatch span:nth-child(1) {
  z-index: 1;
}

.swatch span:nth-child(2) {
  transform: translate3d(0, 100%, 0);
}

.swatch .selected span:nth-child(1) {
  transform: translate3d(50%, 50%, 0);
}

.swatch .selected span:nth-child(2) {
  transform: translate3d(-50%, 50%, 0) scale(2);
}
</style>

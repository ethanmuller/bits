<script setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import Spreditor from './components/Spreditor.vue'
import Spravigator from './components/Spravigator.vue'
import { usePxStore } from './stores/PxStore.js'
import { sfx } from './Sfx.js'
import * as Tone from 'tone'
import { viewWidth, viewHeight, imageWidth, imageHeight } from './dimensions'
import { useRoute } from 'vue-router';
import { rooms as roomData } from './rooms';

const themes = {
  '/a': {
    fg: '#000',
    bg: '#fff',
    hl: '#ffcc00',
  },
  '/b': {
    fg: '#f00',
    bg: '#ffffff',
    hl: '#ffcccc',
  },
  '/c': {
    fg: '#030',
    bg: '#ffffff',
    hl: '#ccddcc',
  },
  '/d': {
    fg: '#30a',
    bg: '#fff',
    hl: '#fcf',
  },
  '/local': {
    fg: '#000',
    bg: '#fff',
    hl: '#ffcc00',
  },
}

const route = useRoute();
const currentTheme = route.path;

const store = usePxStore()

const clientsList = ref([])

store.$subscribe((mutation, s) => {
  updateCanvas()
})

const clipboardCanvas = ref(null)

const themeSynth = new Tone.PolySynth().toDestination();
themeSynth.set({
  oscillator: {
    type: 'sine',
  },
  envelope: {
    attack: 0,
    decay: 0.2,
    sustain: 0,
    release: 0,
  },
  filter : {
    Q: 2,
    type : 'lowpass' ,
    rolloff : -48,
    frequency: 200,
  },
});

const state = reactive({
  ctx: null,
})

function handleKeyDown(event) {
   if (event.key === 'w' || event.key === 'ArrowUp') {
    store.setPan(store.pan[0], store.pan[1] - 1)
   }
   if (event.key === 'a' || event.key === 'ArrowLeft') {
    store.setPan(store.pan[0] - 1, store.pan[1])
   }
   if (event.key === 's' || event.key === 'ArrowDown') {
    store.setPan(store.pan[0], store.pan[1] + 1)
   }
   if (event.key === 'd' || event.key === 'ArrowRight') {
    store.setPan(store.pan[0] + 1, store.pan[1])
   }
}

onMounted(async () => {
  await store.initializeSocket();

  state.ctx = clipboardCanvas.value.getContext('2d')

  setupSocketEvents();

  updateCanvas()


  window.addEventListener('focus', windowReturn);
  window.addEventListener('blur', windowLeave);
  window.addEventListener('keydown', handleKeyDown);
})

onUnmounted(() => {
  store.disconnectSocket()

  window.removeEventListener('focus', windowReturn);
  window.removeEventListener('blur', windowLeave);
  window.removeEventListener('keydown', handleKeyDown);
})

function updateCanvas() {
  if (state && state.ctx) {
    const pxColor = themes[currentTheme].fg

    state.ctx.fillStyle = pxColor
    state.ctx.clearRect(0, 0, 9, 9)

    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        const v = store.clipboard[y][x]
        if (v === 1) {
          state.ctx.fillRect(x,y,1,1)
        }
      }
    }
  }
}

function clear() {
  store.clearView()
  store.socket.emit('chunkSet', store.pan[0]*9, store.pan[1]*9, f)
}

function copy() {
  for (let y = 0; y < store.clipboard.length; y++) {
    for (let x = 0; x < store.clipboard.length; x++) {
      store.clipboard[y][x] = store.px[y + store.pan[1]*9][x + store.pan[0]*9]
    }
  }
}

function isChunkEmpty(chunk) {
  const height = chunk.length
  const width = chunk[0].length

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (chunk[y][x] !== 0) {
        return false
      }
    }
  }

  return true
}

function invert() {
  const chunk = getViewedChunk()

  const height = chunk.length
  const width = chunk[0].length

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      chunk[y][x] = chunk[y][x] === 1 ? 0 : 1
    }
  }

  store.chunkSet(store.pan[0]*9, store.pan[1]*9, chunk)
  store.socket.emit('chunkSet', store.pan[0]*9, store.pan[1]*9, chunk)

  store.i = (store.i + 1) % 2
  sfx.bwip()
  store.socket.emit('sfx', 'bwip')
}

function getViewedChunk() {
  const chunk = store.px.slice(store.pan[1]*9, store.pan[1]*9+9)

  for (let y = 0; y < 9; y++) {
    chunk[y] = chunk[y].slice(store.pan[0]*9, store.pan[0]*9+9)
  }

  return chunk
}

function cut() {
  store.cut()
  sfx.down()
  store.socket.emit('sfx', 'down')
}

function ass(x,y) {
  store.setPan(store.pan[0] + x, store.pan[1] + y)
}

function randomize() {
  const chunk = getViewedChunk()

  const height = chunk.length
  const width = chunk[0].length

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = Math.random() >= 0.95;
      if (r) {
        chunk[y][x] = chunk[y][x] === 1 ? 0 : 1
      }
    }
  }

  store.chunkSet(store.pan[0]*9, store.pan[1]*9, chunk)
  store.socket.emit('chunkSet', store.pan[0]*9, store.pan[1]*9, chunk)

  sfx.csh()
  store.socket.emit('sfx', 'csh')
}

function paste() {
  store.chunkSet(store.pan[0]*9, store.pan[1]*9, store.clipboard)
  store.socket.emit('chunkSet', store.pan[0]*9, store.pan[1]*9, store.clipboard)

  sfx.up()
  store.socket.emit('sfx', 'up')
}

function triggerThemeChange(ev, themeName) {
  store.changeTheme(themeName)

  try {
    themeSynth.triggerAttackRelease(750, "64n");
  } catch(e) {
  }
}

function clearAll() {
  const shouldClear = confirm('Clear the whole board?')
  if (shouldClear) {
    store.socket.emit('clear')
  }
}

function setupSocketEvents() {
  store.socket.on('sfx', (sfk) => {
    sfx[sfk]()
  })

  store.socket.on('theme changed', (themeName) => {
    store.changeTheme(themeName)

    try {
      themeSynth.triggerAttackRelease(750, "64n");
    } catch(e) {
    }
  })

  store.socket.on('player list', (list) => {
    //clientsList.value = list.filter((i) => i !== store.socket.id)
    clientsList.value = list
  })
}

function windowLeave() {
}

function windowReturn() {
  console.log('asking server for new data')
  store.socket.emit('join', (data) => {
    store.px = data.px
    updateCanvas()
    clientsList.value = data.clientsList
  })
}


</script>


<template>
  <div class="wrapper" style="--editor-bg: red;">
    <div class="status-bar" v-if="store.socket && store.socket.connected && clientsList && clientsList.length">
      <div><span class="indicator positive"></span> Connected</div>
      <div>Users online: {{clientsList.length}}</div>
    </div>
    <div class="status-bar" v-else>
      <div><span class="indicator warning"></span> Connecting...</div>
    </div>
    <div :style="{ opacity: store.socket && store.socket.connected ? 1 : 0.25, transition: 'all 500ms ease-out'}">
      <Spreditor tone="Tone" :theme="themes[currentTheme]" width="9" height="9" />
      <div class="toolbar">

        <!--<button class="clear-btn" @click="clearAll">clear all</button>-->
        <button class="neo-btn toolbar-btn rando-btn" @click="randomize"><span class="neo-btn__inner">🎲</span></button>
        <button class="neo-btn toolbar-btn invert-btn" @click="invert"><span class="neo-btn__inner"><span :style="{ display: 'inline-block', transform: `rotate(${ 180 * store.i }deg)` }">🌓</span></span></button>
        <button class="neo-btn toolbar-btn cut-btn" @click="cut" :disabled="isChunkEmpty(getViewedChunk())"><span class="neo-btn__inner">✂️</span></button>
        <button class="neo-btn toolbar-btn clipboard-btn" @click="paste">
          <canvas ref="clipboardCanvas" width="9" height="9" :style="{ background: themes[currentTheme].hl }" class="neo-btn__inner"></canvas>
        </button>
      </div>
      <div class="navigator">
        <div class="arrows">
          <button class="neo-btn bl arrow-btn arrow-btn--horizontal" @click="ass(-1, 0)"><span class="neo-btn__inner">←</span></button>
          <button class="neo-btn b arrow-btn arrow-btn--vertical" @click="ass(0, 1)"><span class="neo-btn__inner">↓</span></button>
          <button class="neo-btn t arrow-btn arrow-btn--vertical" @click="ass(0, -1)"><span class="neo-btn__inner">↑</span></button>
          <button class="neo-btn br arrow-btn arrow-btn--horizontal" @click="ass(1, 0)"><span class="neo-btn__inner">→</span></button>
        </div>
        <Spravigator :theme="themes[currentTheme]"/>
      </div>
    </div>
  </div>

</template>

<style>

.wrapper {
  max-width: 480px;
  margin: 0 auto;
}

.palettes {
  display: flex;

  flex-wrap: wrap;
  width: 100%;
  justify-content: center;

  margin-top: 0.5em;
}
.palettes button {
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  display: flex;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  padding: 0;

  width: 3rem;
  height: 3rem;

  margin: 0.5em;
}

.palettes button.selected {
}

.palettes span {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  transition: all 100ms;
  transform-origin: 50% 50%;
}

.palettes span:nth-child(1) {
  z-index: 1;
}

.palettes span:nth-child(2) {
  transform: translate3d(0, 100%, 0);
}

.palettes .selected span:nth-child(1) {
  transform: translate3d(50%, 50%, 0);
}

.palettes .selected span:nth-child(2) {
  transform: translate3d(-50%, 50%, 0) scale(2);
}
.clear-btn {
}

.toolbar {
  display: flex;
  flex-direction: row;
  justify-content: stretch;
  align-items: space-between;
  margin-top: 0.25rem;
  gap: 0.5rem;
  padding: 0 0.5rem 0.5rem;
}

.navigator {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding-right: 0.5rem;
  padding-bottom: 3rem;
  align-items: end;
}

.arrows {
  padding: 0 0.5rem;
  display: grid;
  grid-auto-rows: 48px;
  grid-template-columns: 48px 48px 48px;
  grid-template-areas: "tl t tr"
                       "bl b br";
  min-height: 5em;
  position: relative;
  z-index: 1;
  gap: 0.5rem;
}

.arrows .t {
  grid-area: t;
}
.arrows .bl {
  grid-area: bl;
  position: relative;
    z-index: 2;
}
.arrows .b {
  grid-area: b;
  position: relative;
    z-index: 1;
}
.arrows .br {
  grid-area: br;
}

.neo-btn {
  font-size: 1em;
  padding: 0;
  margin: 0;
  overflow: hidden;
  touch-action: manipulation;

  font-family: inherit;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: #eee;
  transition: .7s all ease-out;
  box-shadow: 5.63px -5.63px 10.03px #ffffffc2, 1.04px -1.04px 3.62px #ffffffb3, -45px 45px 80px #00000012, -13.57px 13.5662px 24.1177px #00000007, -5.63px 5.6347px 10.0172px #0000000c, -2.04px 2.03796px 2.62304px #0000000d, -1.04px 1.03796px 3px #0000000d, inset -1px 1px 3px #0000, inset 1px -1px 3px #fff0;

  display: flex;
  align-items: center;
  justify-content: center;
}
.neo-btn:hover {
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
.neo-btn:active {
  transition-duration: 0s;
  background: #eaeaea;
  box-shadow: 0 0 #ffffffc2, 0 0 #ffffffb3, 0 0 #00000012, 0 0 #00000007, 0 0 #0000000c, 0 0 #0000000d, 0 0 #0000000d, inset -1px 1px 3px #0000001a, inset 1px -1px 3px #fff3;
}
.neo-btn__inner {
  display: inline-block;
  transition: .7s all ease-out;
  transform: scale(1);
}
.neo-btn:active .neo-btn__inner {
  transform: scale(.8);
  transition-duration: 0s;
}

.toolbar-btn {

  width: 48px;
  height: 48px;

  border-radius: 9px;
}

.arrow-btn {
  flex: 1;
  color: #666;
  font-size: 1.5em;
  font-weight: bold;

  line-height: 0;

  width: 100%;
  height: 100%;

}

.cut-btn {
  margin-left: auto;
  margin-right: 0;
  z-index: 1;
}

.clipboard-btn {
}

.toolbar button:disabled {
  opacity: 0.2;
}

.toolbar canvas {
  display: block;
  image-rendering: pixelated;
  width: 36px;
  height: 36px;
}

.status-bar {
  padding: 0.5rem;
  font-family: monospace;
  font-size: 0.7rem;
  display: flex;
  justify-content: space-between;
}
.indicator {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
}
.indicator.positive {
    background: green;
}
.indicator.warning {
    background: #ffc800;;
}
.status-text {
  opacity: 0.5;
}

</style>

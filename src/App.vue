<script setup>
import { reactive, ref, onMounted } from 'vue'
import Spreditor from './components/Spreditor.vue'
import Spravigator from './components/Spravigator.vue'
import { usePxStore } from './stores/PxStore.js'
import * as Tone from 'tone'

const store = usePxStore()

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

onMounted(() => {
  state.ctx = clipboardCanvas.value.getContext('2d')

  updateCanvas()
})

function updateCanvas() {
  if (state && state.ctx) {
    const pxColor = store.themes[store.currentTheme].fg

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
  const f = new Array(9)

  for (let y = 0; y < 9; y++) {
    f[y] = []

    for (let x = 0; x < 9; x++) {
      f[y][x] = 0
    }
  }


  store.chunkSet(store.pan[0]*9, store.pan[1]*9, f)
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
  const chunk = getEditedChunk()

  const height = chunk.length
  const width = chunk[0].length

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      chunk[y][x] = chunk[y][x] === 1 ? 0 : 1
    }
  }

  store.chunkSet(store.pan[0]*9, store.pan[1]*9, chunk)
  store.socket.emit('chunkSet', store.pan[0]*9, store.pan[1]*9, chunk)
}

function getEditedChunk() {
  const chunk = store.px.slice(store.pan[1]*9, store.pan[1]*9+9)

  for (let y = 0; y < 9; y++) {
    chunk[y] = chunk[y].slice(store.pan[0]*9, store.pan[0]*9+9)
  }

  return chunk
}

function cut() {
  for (let y = 0; y < store.clipboard.length; y++) {
    for (let x = 0; x < store.clipboard.length; x++) {
      store.clipboard[y][x] = store.px[y + store.pan[1]*9][x + store.pan[0]*9]
    }
  }

  clear()

  try {
    themeSynth.triggerAttackRelease(450, "64n");
  } catch(e) {
  }
}

function randomize() {
  const chunk = getEditedChunk()

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
}

function paste() {
  store.chunkSet(store.pan[0]*9, store.pan[1]*9, store.clipboard)
  store.socket.emit('chunkSet', store.pan[0]*9, store.pan[1]*9, store.clipboard)

  try {
    themeSynth.triggerAttackRelease(850, "64n");
  } catch(e) {
  }
}

function triggerThemeChange(ev, themeName) {
  store.changeTheme(themeName)
  store.socket.emit('change theme', themeName)

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

store.socket.on('theme changed', (themeName) => {
  store.changeTheme(themeName)

  try {
    themeSynth.triggerAttackRelease(750, "64n");
  } catch(e) {
  }
})

</script>

<template>
  <Spravigator />
  <Spreditor tone="Tone" :theme="store.themes[store.currentTheme]" width="9" height="9" />
  <div class="split">
    <div class="tb" :style="{ background: store.themes[store.currentTheme].bg }">
    <div class="toolbar">
      <button class="clipboard-btn" @click="cut" :disabled="isChunkEmpty(getEditedChunk())">cut✂️</button>
      <button class="clipboard-btn" @click="paste">
        paste
        <canvas ref="clipboardCanvas" width="9" height="9" :style="{ background: store.themes[store.currentTheme].hl }"></canvas>
      </button>

      <button class="clear-btn" @click="clearAll">clear all</button>
      <button class="rando-btn" @click="randomize">randomize</button>
      <button class="invert-btn" @click="invert">invert</button>
    </div>

      <div class="ps" :style="{ color: store.themes[store.currentTheme].fg }">
        <div v-for="theme, themeName in store.themes">
          <button @click="(e) => triggerThemeChange(e, themeName)" :style="{ background: theme.bg }" :class="{ selected: themeName === store.currentTheme }">
            <span :style="{ background: theme.fg }"></span>
            <span :style="{ background: theme.hl }"></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.tb {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.ps {
  display: flex;

  flex-wrap: wrap;
  width: 15em;
  justify-content: center;

  margin-top: 0.5em;
}
.ps button {
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

.ps button.selected {
}

.ps span {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  transition: all 100ms;
  transform-origin: 50% 50%;
}

.ps span:nth-child(1) {
  z-index: 1;
}

.ps span:nth-child(2) {
  transform: translate3d(0, 100%, 0);
}

.ps .selected span:nth-child(1) {
  transform: translate3d(50%, 50%, 0);
}

.ps .selected span:nth-child(2) {
  transform: translate3d(-50%, 50%, 0) scale(2);
}
.clear-btn {
}

.clipboard-btn {
}

.split {
  display: flex;
  flex-direction: row-reverse;
}

.toolbar {
  display: flex;
  flex-direction: row-reverse;
}

.toolbar button {
  padding: 1rem;
  border: none;
  background: red;
  color: white;

  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

.toolbar button:disabled {
  opacity: 0.4;
}

.toolbar canvas {
  display: block;
  image-rendering: pixelated;
  width: 27px;
  height: 27px;
}

</style>

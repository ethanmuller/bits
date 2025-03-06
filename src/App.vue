<script setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import Spreditor from './components/Spreditor.vue'
import Spravigator from './components/Spravigator.vue'
import { usePxStore } from './stores/PxStore.js'
import { sfx } from './Sfx.js'
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

  window.addEventListener('focus', windowReturn);
  window.addEventListener('blur', windowLeave);
})

onUnmounted(() => {
  window.removeEventListener('focus', windowReturn);
  window.removeEventListener('blur', windowLeave);
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

  store.i = (store.i + 1) % 2
  sfx.bwip()
  store.socket.emit('sfx', 'bwip')
}

function getEditedChunk() {
  const chunk = store.px.slice(store.pan[1]*9, store.pan[1]*9+9)

  for (let y = 0; y < 9; y++) {
    chunk[y] = chunk[y].slice(store.pan[0]*9, store.pan[0]*9+9)
  }

  return chunk
}

function cut() {
  let str = '';
  for (let y = 0; y < store.clipboard.length; y++) {
    for (let x = 0; x < store.clipboard.length; x++) {
      str += store.px[y + store.pan[1]*9][x + store.pan[0]*9] ? '#' : '.'
      store.clipboard[y][x] = store.px[y + store.pan[1]*9][x + store.pan[0]*9]
      if (x == store.clipboard.length - 1) {
        str += '\n'
      }
    }
  }
  console.log(str)

  clear()
  sfx.down()
  store.socket.emit('sfx', 'down')
}

function ass(x,y) {
  store.setPan(store.pan[0] + x, store.pan[1] + y)
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

function windowLeave() {
}

function windowReturn() {
  console.log('refreshing data')

  store.socket.emit('join', (data) => {
    store.px = data.px
    updateCanvas()
  })
}


</script>


<template>
  <div class="wrapper">
    <Spravigator />
    <Spreditor tone="Tone" :theme="store.themes[store.currentTheme]" width="9" height="9" />
    <div class="toolbar">

      <!--<button class="clear-btn" @click="clearAll">clear all</button>-->
      <button class="toolbar-btn rando-btn" @click="randomize">🎲</button>
      <button class="toolbar-btn invert-btn" @click="invert"><span :style="{ transform: `rotate(${ 180 * store.i }deg)` }">🌓</span></button>
      <button class="toolbar-btn cut-btn" @click="cut" :disabled="isChunkEmpty(getEditedChunk())">✂️</button>
      <button class="toolbar-btn clipboard-btn" @click="paste">
        <canvas ref="clipboardCanvas" width="9" height="9" :style="{ background: store.themes[store.currentTheme].hl }"></canvas>
      </button>
    </div>
    <div class="arrows">
      <button class="arrow-btn arrow-btn--horizontal" @click="ass(-1, 0)">←</button>
      <button class="arrow-btn arrow-btn--vertical" @click="ass(0, 1)">↓</button>
      <button class="arrow-btn arrow-btn--vertical" @click="ass(0, -1)">↑</button>
      <button class="arrow-btn arrow-btn--horizontal" @click="ass(1, 0)">→</button>
    </div>
  </div>

  <div class="palettes" :style="{ color: store.themes[store.currentTheme].fg }">
    <div v-for="theme, themeName in store.themes">
      <button @click="(e) => triggerThemeChange(e, themeName)" :style="{ background: theme.bg }" :class="{ selected: themeName === store.currentTheme }">
        <span :style="{ background: theme.fg }"></span>
        <span :style="{ background: theme.hl }"></span>
      </button>
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
  display: none;

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
  min-height: 5em;
  margin-top: 0.25rem;
}

.arrows {
  display: flex;
  flex-direction: row;
  justify-content: stretch;
  min-height: 5em;
  position: relative;
  z-index: 1;
}

.toolbar-btn {
  padding: 0;
  margin: 0 0.25em;
  border: none;
  background: white;
  color: black;
  overflow: hidden;
  font-size: 1em;

  touch-action: manipulation;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 4.625rem;
  height: 4.625rem;

  border-radius: 50px;
  background: #f6f5f4;
  box-shadow:  -20px 20px 60px #d1d0cf,
               20px -20px 60px #ffffff;
}

.toolbar-btn:active {
  background: #f6f5f4;
  box-shadow: inset -20px 20px 60px #d1d0cf,
              inset 20px -20px 60px #ffffff;
}

.arrow-btn {
  flex: 1;
  padding: 0;
  margin: 0;
  border: none;
  color: #666;
  overflow: hidden;

  touch-action: manipulation;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 1.5em;
  font-weight: bold;

  line-height: 0;

  width: 4.625rem;
  height: 4.625rem;

  border-radius: 50px;
  background: #f6f5f4;
  box-shadow:  -20px 20px 60px #d1d0cf,
               20px -20px 60px #ffffff;
}

.arrow-btn:nth-child(1) {
  border-radius: 99em 0 0 99em;
}

.arrow-btn:nth-child(2), .arrow-btn:nth-child(3) {
  border-radius: 0;
  box-shadow: none;
  z-index: 1;
}

.arrow-btn:nth-child(4) {
  border-radius: 0 99em 99em 0;
}

.arrow-btn:active {
  background: #f6f5f4;
  box-shadow: inset -20px 20px 60px #d1d0cf,
              inset 20px -20px 60px #ffffff;
}

.arrow-btn--horizontal {
  padding-bottom: 0.2em;
}

.cut-btn {
  margin-left: auto;
  margin-right: 0;
  border-radius: 99rem 0 0 99rem;
  z-index: 1;
}

.clipboard-btn {
  margin-left: 0;
  border-radius: 0 99em 99em 0;
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

</style>

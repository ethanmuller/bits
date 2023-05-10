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

function copyToSystemClipboard(str) {
  const el = document.createElement('textarea');  // create a temporary element to hold the text
  el.value = str;                                 // set the element's value to the string
  document.body.appendChild(el);                  // add the element to the DOM
  el.select();                                    // select the text in the element
  document.execCommand('copy');                    // copy the selected text
  document.body.removeChild(el);                  // remove the element from the DOM
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
  copyToSystemClipboard(str)

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

function capture() {
  sfx.capture()
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

    <div class="capture">
        <button class="toolbar-btn capture-btn" @click="capture">
            <span class="a"></span>
            <span class="b"></span>
            <span class="c"></span>
            <span class="d"></span>
        </button>
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
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.capture {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 5rem;
  padding-bottom: 12rem;
}

.arrows {
  display: flex;
  flex-direction: row;
  justify-content: stretch;
  position: relative;
  z-index: 1;
}

.toolbar-btn {
  padding: 0;
  margin: 0 0.125em;
  border: none;
  background: #fff;
  color: black;
  overflow: hidden;
  font-size: 2em;

  touch-action: manipulation;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 4.625rem;
  height: 4.625rem;

  border-radius: 5px;
}

.toolbar-btn:active {
    background: #ff0;
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
  background: #ddd;
}

.arrow-btn:nth-child(1) {
  border-radius: 5px 0 0 5px;
}

.arrow-btn:nth-child(2), .arrow-btn:nth-child(3) {
  border-radius: 0;
  z-index: 1;
}

.arrow-btn:nth-child(4) {
  border-radius: 0 5px 5px 0;
}

.arrow-btn:active {
  background: #ccc;
}

.arrow-btn--horizontal {
  padding-bottom: 0.2em;
}

.cut-btn {
  margin-left: auto;
  margin-right: 0;
  z-index: 1;
  border-radius: 5px 0 0 5px;
}

.clipboard-btn {
  margin-left: 0;
  border-radius: 0 5px 5px 0;
}

.capture-btn {
    position: relative;
}

.capture-btn > span {
    display: block;
    position: absolute;
    border: solid black;
    width: 6px;
    height: 6px;
}

.capture-btn .a {
    border-width: 3px 0 0 3px;
    top: 1.2rem;
    left: 1.2rem;
}

.capture-btn .b {
    border-width: 0 0 3px 3px;
    bottom: 1.2rem;
    left: 1.2rem;
}

.capture-btn .c {
    border-width: 3px 3px 0 0;
    top: 1.2rem;
    right: 1.2rem;
}

.capture-btn .d {
    border-width: 0 3px 3px 0;
    bottom: 1.2rem;
    right: 1.2rem;
}

.toolbar button:disabled {
  opacity: 0.2;
}

.toolbar canvas {
  display: block;
  image-rendering: pixelated;
  width: 64px;
  height: 64px;
}

</style>

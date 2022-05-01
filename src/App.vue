<script setup>
import Spreditor from './components/Spreditor.vue'
import Spravigator from './components/Spravigator.vue'
import { usePxStore } from './stores/PxStore.js'
import * as Tone from 'tone'

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

const store = usePxStore()

function random() {
  const f = new Array(9)

  for (let y = 0; y < 9; y++) {
    f[y] = []

    for (let x = 0; x < 9; x++) {
      f[y][x] = Math.random() > 0.5 ? 1 : 0
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
  console.log(store.clipboard)
}

function paste() {
  store.chunkSet(store.pan[0]*9, store.pan[1]*9, store.clipboard)
  store.socket.emit('chunkSet', store.pan[0]*9, store.pan[1]*9, store.clipboard)
}

function triggerThemeChange(ev, themeName) {
  store.changeTheme(themeName)
  store.socket.emit('change theme', themeName)

  try {
    themeSynth.triggerAttackRelease(750, "64n");
  } catch(e) {
  }
}

function clear() {
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
  <button @click="copy">copy</button>
  <button @click="paste">paste</button>
  <button @click="random">random</button>
  <div class="tb" :style="{ background: store.themes[store.currentTheme].bg }">

    <div class="ps" :style="{ color: store.themes[store.currentTheme].fg }">
      <div v-for="theme, themeName in store.themes">
        <button @click="(e) => triggerThemeChange(e, themeName)" :style="{ background: theme.bg }" :class="{ selected: themeName === store.currentTheme }">
          <span :style="{ background: theme.fg }"></span>
          <span :style="{ background: theme.hl }"></span>
        </button>
      </div>
    </div>

    <button class="clear-btn" @click="clear">🗳️</button>

  </div>
</template>

<style>
.tb {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.ps {
  align-self: center;

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
  padding: 1rem;
  border: none;
  background: red;
  color: white;

  align-self: end;
}
</style>

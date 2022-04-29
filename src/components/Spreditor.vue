<script setup>
import { reactive, ref, onMounted } from 'vue'
import * as Tone from 'tone'
import { usePxStore } from '../stores/PxStore.js'

const store = usePxStore()

store.$subscribe((mutation, s) => {
  updateCanvas()
})

const pad = ref(null)

const props = defineProps(['width', 'height', 'theme'])


let lastX, lastY

let synth, synth2, synth3

const state = reactive({
  left: null,
  top: null,
  elWidth: null,
  elHeight: null,
  pxHeight: null,
  px: [],
  //canvas: null,
  ctx: null,
  c: 1,
  isAudioSetup: false,
})

store.socket.on('updateAll', (px) => {
  store.px = px
  updateCanvas()

  try {
    synth2.triggerAttackRelease(500, "64n");
  } catch(e) {
  }
})
store.socket.on('updatePx', (x,y,c) => {
  //playSound(x,y)

  try {
    synth3.triggerAttackRelease(500, "64n");
  } catch(e) {
  }
  store.pset(x,y,c)
  updateCanvas()
})

store.socket.emit('join', (data) => {
  store.px = data.px
  store.currentTheme = data.currentTheme
  console.log(data)
  updateCanvas()
})

function setupAudio(e) {
  synth = new Tone.PolySynth().toDestination();
  synth.set({
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0,
      decay: 0.01,
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

  synth2 = new Tone.PolySynth().toDestination();
  synth2.set({
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0,
      decay: 0.1,
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

  synth3 = new Tone.PolySynth().toDestination();
  synth3.set({
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0,
      decay: 0.01,
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


  state.isAudioSetup = true
}

function touchMove(e) {
  var rect = e.target.getBoundingClientRect();

  var tx = e.changedTouches[0].clientX - rect.left;
  var ty = e.changedTouches[0].clientY - rect.top;

  const x = Math.floor(tx/rect.width*props.width)
  const y = Math.floor(ty/rect.height*props.width)

  if (x < 0 || y < 0 ||
    x >= props.width || y >= props.height) {
    return
  }


  // if changed from last position, draw
  if (x !== lastX || y !== lastY) {
    if (store.pget(x,y) === state.c) {
      return
    }
    draw(x,y)
  }

  lastX = x
  lastY = y
}

function handleMousedown(e) {
  const ev = e
  ev.changedTouches = []
  ev.changedTouches[0] = {}
  ev.changedTouches[0].clientX = e.clientX
  ev.changedTouches[0].clientY = e.clientY
  touchStart(ev)
}
function handleMousemove(e) {
}

function touchStart(e) {
  var rect = e.target.getBoundingClientRect();

  var tx = e.changedTouches[0].clientX - rect.left;
  var ty = e.changedTouches[0].clientY - rect.top;

  const x = Math.floor(tx/rect.width*props.width)
  const y = Math.floor(ty/rect.height*props.width)

  if (x < 0 || y < 0 ||
    x >= props.width || y >= props.height) {
    return
  }

  state.c = store.pget(x,y) === 1 ? 0 : 1

  draw(x,y)

  lastX = x
  lastY = y
}

function draw(x,y) {
  const px = x + store.pan[0]*props.width
  const py = y + store.pan[1]*props.height
    playSound(x,y, state.c)
    store.pset(px, py, state.c)
    store.socket.emit('pset', px, py, state.c)
    updateCanvas()
}

function playSound(x,y) {
  if (!state.isAudioSetup) {
    setupAudio()
  }

  synth.triggerAttackRelease(y/props.height*600 + x/props.width * 600 + 900 * state.c, "64n");
}

onMounted(() => {
  state.ctx = pad.value.getContext('2d')

  updateCanvas()
})

function updateCanvas() {
  if (state && state.ctx) {
    const pxColor = store.themes[store.currentTheme].fg

    state.ctx.clearRect(0, 0, props.width, props.width)
    state.ctx.fillStyle = pxColor

    const panX = store.pan[0]*props.width

    for (let y = 0; y < props.width; y++) {
      for (let x = 0; x < props.width; x++) {
        const v = store.pget(x,y)
        if (v === 1) {
          state.ctx.fillRect(x,y,1,1)
        }
      }
    }
  }
}

</script>

<template>
  <div class="wrapper">
    <canvas ref="pad" class="px-canvas" :width="props.width" :height="props.height" v-on:touchstart.prevent.disablePassive="touchStart" v-on:touchmove.prevent.disablePassive="touchMove" :style="{ background: store.themes[store.currentTheme].hl }"></canvas>
  </div>
</template>

<style>

.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  /* subtracting from 100vh to account for
  mobile browser chrome */
  /*
  min-height: calc(100vh - 80px);
  */
}


.px-canvas {
  width: 100%;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  margin: 0;
  image-rendering: pixelated;
}
</style>

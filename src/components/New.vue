<script setup>
import { reactive, ref, onMounted } from 'vue'
import { io } from 'socket.io-client'
import * as Tone from 'tone'

const canvas = ref(null)

let lastX, lastY

let synth, synth2

const state = reactive({
  left: null,
  top: null,
  elWidth: null,
  elHeight: null,
  pxWidth: null,
  pxHeight: null,
  px: [],
  //canvas: null,
  ctx: null,
  c: 1,
  isAudioSetup: false,
  socket: io(),
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


  state.isAudioSetup = true
}

function setSizing() {
  const rects = canvas.value.getClientRects()
  state.left = rects[0].left

  state.top = rects[0].top
  state.elWidth = rects[0].width
  state.elHeight = rects[0].height
}

function touchMove(e) {
  const x = Math.floor(Math.floor(e.changedTouches[0].clientX - state.left)/state.elWidth*state.pxWidth)
  const y = Math.floor(Math.floor(e.changedTouches[0].clientY - state.top)/state.elHeight*state.pxHeight)

  // if changed from last position, draw
  if (x !== lastX || y !== lastY) {
    if (pget(x,y) === state.c) {
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
  const x = Math.floor(Math.floor(e.changedTouches[0].clientX - state.left)/state.elWidth*state.pxWidth)
  const y = Math.floor(Math.floor(e.changedTouches[0].clientY - state.top)/state.elHeight*state.pxHeight)

  if (x < 0 || y < 0 ||
    x >= state.pxWidth || y >= state.pxWidth) {
    return
  }

  state.c = pget(x,y) === 1 ? 0 : 1

  draw(x,y)

  lastX = x
  lastY = y
}

function draw(x,y) {
    playSound(x,y, state.c)
    pset(x, y, state.c)
    state.socket.emit('pset', x, y, state.c)
}

function playSound(x,y) {
  if (!state.isAudioSetup) {
    setupAudio()
  }

  synth.triggerAttackRelease(y/state.pxHeight*600 + x/state.pxWidth * 600 + 900 * state.c, "64n");
}

onMounted(() => {

  state.ctx = canvas.value.getContext('2d')

  state.pxWidth = canvas.value.width
  state.pxHeight = canvas.value.height

  state.px = new Array(state.pxHeight)

  for (let y = 0; y < state.px.length; y++) {
    state.px[y] = []

    for (let x = 0; x < state.pxWidth; x++) {
      state.px[y][x] = 0
    }
  }

  setSizing()

  window.addEventListener('resize', setSizing)

  state.socket.on('updateAll', (px) => {
    state.px = px
    drawFromPx()
    try {
      synth2.triggerAttackRelease(500, "64n");
    } catch(e) {
    }
  })
  state.socket.on('updatePx', (x,y,c) => {
    playSound(x,y)
    pset(x,y,c)
    drawFromPx()
  })

  state.socket.emit('join', (px) => {
    state.px = px
    drawFromPx()
  })
})

function pget(x, y) {
  return state.px[y][x]
}
function pset(x, y, c) {
  state.px[y][x] = c
  drawFromPx()
}

function drawFromPx() {
  state.ctx.clearRect(0, 0, state.pxWidth, state.pxHeight)
  state.ctx.fillStyle = 'white'

  for (let y = 0; y < state.px.length; y++) {
    for (let x = 0; x < state.pxWidth; x++) {
      const v = state.px[y][x]
      if (v === 1) {
        state.ctx.fillRect(x,y,1,1)
      }
    }
  }
}

function clear() {
  state.socket.emit('clear')
}

</script>

<template>
  <div class="wrapper">
    <canvas ref="canvas" class="px-canvas" width="9" height="15" v-on:touchstart.prevent.disablePassive="touchStart" v-on:touchmove.prevent.disablePassive="touchMove"></canvas>
    <div class="toolbar">
      <button @click="clear">🗳️</button>
    </div>
  </div>
</template>

<style>
body {
    background: #000;

    max-width: 38em;
    margin: 0 auto;

    /* overflow: hidden; */
    flex-direction: column;
    justify-content: flex-start;


    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently
    supported by Chrome, Edge, Opera and Firefox */

}

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
  background: #111;
  width: 100%;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  margin: 0;
  image-rendering: pixelated;
}
.toolbar {
  background: purple;
  position: absolute;
  bottom: 1em;
  right: 1em;
}
.toolbar button {
  padding: 1rem;
  border: none;
  background: red;
  color: white;
}
</style>

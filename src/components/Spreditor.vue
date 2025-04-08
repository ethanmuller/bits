<script setup>
import { reactive, ref, onMounted, watch } from 'vue'
import * as Tone from 'tone'
import { usePxStore } from '../stores/PxStore.js'
import { sfx } from '../Sfx.js'
import { viewWidth, viewHeight, imageWidth, imageHeight } from '../dimensions'

const store = usePxStore()

store.$subscribe((mutation, s) => {
  updateCanvas()
})

const pad = ref(null)

const props = defineProps(['width', 'height', 'theme'])

let isMouseDown = false


let lastX, lastY

let lastDrawX = null
let lastDrawY = null

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

function setupSocketEvents() {
  if (!store.socket) return;
  store.socket.on('updateAll', (px) => {
    store.px = px
    updateCanvas()

    try {
      //synth2.triggerAttackRelease(500, "64n");
    } catch(e) {
    }
  })
  store.socket.on('updatePx', (x,y,pan,c) => {
    sfx.bit(x, y, c)
    //playSound(x,y)

    try {
      //synth3.triggerAttackRelease(500, "64n");
    } catch(e) {
    }
    store.pset(x+pan[0]*viewWidth, y+pan[1]*viewHeight, c)
    updateCanvas()
  })

  store.socket.on('updateChunk', (panX, panY, chunkPx) => {
    store.chunkSet(panX, panY, chunkPx)
    updateCanvas()
  })

  store.socket.emit('join', (data) => {
    store.px = data.px
    store.currentTheme = data.currentTheme
    updateCanvas()
  })
}

function setupAudio(e) {

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

function drawLine(x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  while (true) {
    draw(x0, y0)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }
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


  // if changed from last position, draw line
  if (x !== lastX || y !== lastY) {
    if (lastDrawX !== null && lastDrawY !== null) {
      drawLine(lastDrawX, lastDrawY, x, y, state.c)
    } else {
      draw(x, y)
    }
  }

  lastX = x
  lastY = y
  lastDrawX = x
  lastDrawY = y
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
  var rect = e.target.getBoundingClientRect()
  var tx = e.changedTouches[0].clientX - rect.left
  var ty = e.changedTouches[0].clientY - rect.top

  const x = Math.floor(tx/rect.width*props.width)
  const y = Math.floor(ty/rect.height*props.width)

  if (x < 0 || y < 0 || x >= props.width || y >= props.height) {
    return
  }

  // Reset drawing state
  lastDrawX = null
  lastDrawY = null
  
  state.c = store.pget(x,y) === 1 ? 0 : 1
  draw(x,y)

  lastX = x
  lastY = y
  lastDrawX = x
  lastDrawY = y
}

function mouseDown(e) {
  isMouseDown = true

  e.changedTouches = [{
    clientX: e.clientX,
    clientY: e.clientY,
  }]

  touchStart(e)
}

function mouseUp(e) {
  isMouseDown = false
  touchEnd(e)
}

function mouseMove(e) {
  if (!isMouseDown) {
    return
  }

  e.changedTouches = [{
    clientX: e.clientX,
    clientY: e.clientY,
  }]

  touchMove(e)
}

function draw(x,y) {
    // Only play sound and emit if the pixel value is actually changing
    const currentValue = store.pget(x, y)
    
    if (currentValue !== state.c) {
        sfx.bit(x, y, state.c)
        store.pset(x + store.pan[0]*viewWidth, y + store.pan[1]*viewHeight, state.c)
        store.socket.emit('pset', x, y, store.pan, state.c)
        updateCanvas()
    }
}

function playSound(x,y) {
  if (!state.isAudioSetup) {
    setupAudio()
  }

}

onMounted(() => {
  state.ctx = pad.value.getContext('2d')

  updateCanvas()
  if (store.socket) {
    setupSocketEvents();
  }
  
  // Add global mouseup listener
  window.addEventListener('mouseup', mouseUp)
})

watch(() => store.socket, (newSocket) => {
  if (newSocket) {
    setupSocketEvents();
  }
})

function updateCanvas() {
  if (state && state.ctx) {
    const pxColor = store.themes[store.currentTheme].fg

    state.ctx.clearRect(0, 0, props.width, props.width)
    state.ctx.fillStyle = pxColor

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

// Add touchEnd function
function touchEnd(e) {
    lastDrawX = null
    lastDrawY = null
    lastX = null
    lastY = null
}

function mouseLeave(e) {
  // Save the last position before leaving
  const rect = e.target.getBoundingClientRect()
  const x = Math.floor((e.clientX - rect.left)/rect.width*props.width)
  const y = Math.floor((e.clientY - rect.top)/rect.height*props.width)
  
  if (x >= 0 && x < props.width && y >= 0 && y < props.height) {
    lastX = x
    lastY = y
  }
}

function mouseEnter(e) {
  if (isMouseDown) {
    const rect = e.target.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left)/rect.width*props.width)
    const y = Math.floor((e.clientY - rect.top)/rect.height*props.width)
    
    if (x >= 0 && x < props.width && y >= 0 && y < props.height) {
      // Just set the new position without drawing a line
      lastX = x
      lastY = y
      lastDrawX = x
      lastDrawY = y
    }
  }
}

</script>

<template>
  <canvas
    ref="pad"
    class="px-canvas"
    :width="props.width"
    :height="props.height"
    @mousedown="mouseDown"
    @mouseup="mouseUp"
    @mousemove="mouseMove"
    @mouseleave="mouseLeave"
    @mouseenter="mouseEnter"
    v-on:touchstart.prevent="touchStart"
    v-on:touchmove.prevent="touchMove"
    v-on:touchend.prevent="touchEnd"
    :style="{ background: store.themes[store.currentTheme].hl }"
    ></canvas>
</template>

<style>
.px-canvas {
  display: block;
  width: 100%;
  margin: 0;
  position: relative;
  z-index: 2;

  image-rendering: pixelated;

  touch-action: manipulation;
}
</style>

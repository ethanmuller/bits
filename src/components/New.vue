<script setup>
import { reactive, ref, onMounted } from 'vue'

const canvas = ref(null)

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
})

function touchStart(e) {
  const x = Math.floor(Math.floor(e.changedTouches[0].clientX - state.left)/state.elWidth*state.pxWidth)
  const y = Math.floor(Math.floor(e.changedTouches[0].clientY - state.top)/state.elHeight*state.pxHeight)

  if (x < 0 || y < 0 ||
    x >= 8 || y >= 16) {
    return
  }

  pset(x, y, state.c)
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

  const rects = canvas.value.getClientRects()
  state.left = rects[0].left
  state.top = rects[0].top
  state.elWidth = rects[0].width
  state.elHeight = rects[0].height
})

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

</script>

<template>
  <div class="wrapper" v-on:touchstart.prevent.disablePassive="touchStart" v-on:touchmove.prevent.disablePassive="touchStart">
    <canvas ref="canvas" class="px-canvas" width="8" height="16"></canvas>
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
  min-height: calc(100vh - 80px);
}


.px-canvas {
  background: black;
  width: 260px !important;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  margin: 0;
  image-rendering: pixelated;
}
</style>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { usePxStore } from '../stores/PxStore.js'
import { viewWidth, viewHeight, imageWidth, imageHeight } from '../dimensions'

const store = usePxStore()

const props = defineProps(['theme'])

let isMouseDown = false

store.$subscribe((mutation, state) => {
  updateCanvas()
})

const nav = ref(null)

const state = reactive({
  ctx: null,

  // for storing touch offset
  left: null,
  top: null,
  elWidth: null,
  elHeight: null,
  lastX: null,
  lastY: null,
})

onMounted(() => {
  state.ctx = nav.value.getContext('2d')

  updateCanvas()
})

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

function touchStart(e) {
  var rect = e.target.getBoundingClientRect();

  var tx = e.changedTouches[0].clientX - rect.left;
  var ty = e.changedTouches[0].clientY - rect.top;

  const x = Math.floor(tx/rect.width*(imageWidth/viewWidth))
  const y = Math.floor(ty/rect.height*(imageHeight/viewHeight))

  if (x < 0 || y < 0 ||
    x >= (imageWidth/viewWidth) || y >= (imageHeight/viewHeight)) {
    return
  }

  store.setPan(x,y)

  state.lastX = x
  state.lastY = y
}

function touchMove(e) {
  var rect = e.target.getBoundingClientRect();

  var tx = e.changedTouches[0].clientX - rect.left;
  var ty = e.changedTouches[0].clientY - rect.top;

  const x = Math.floor(tx/rect.width*(imageWidth/viewWidth))
  const y = Math.floor(ty/rect.height*(imageHeight/viewHeight))

  if (x < 0 || y < 0 ||
    x >= (imageWidth/viewWidth) || y >= (imageHeight/viewHeight)) {
    return
  }

  if (x !== state.lastX || y !== state.lastY) {
    store.setPan(x,y)
  }

  state.lastX = x
  state.lastY = y
}

function updateCanvas() {
  const pxColor = store.themes[store.currentTheme].fg
  const hlColor = store.themes[store.currentTheme].hl

  state.ctx.clearRect(0, 0, imageWidth, imageHeight)
  state.ctx.fillStyle = pxColor

  for (let y = 0; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      const v = store.px[y][x]
      if (v === 1) {
        state.ctx.fillRect(x,y,1,1)
      }
    }
  }

  state.ctx.globalCompositeOperation = 'destination-over'
  state.ctx.fillStyle = hlColor
  state.ctx.fillRect(store.pan[0]*viewWidth, store.pan[1]*viewHeight, viewWidth, viewHeight)
}
</script>

<template>
  <canvas
    ref="nav"
    class="spravigator"
    :width="imageWidth"
    :height="imageHeight"
    @mousedown="mouseDown"
    @mouseup="mouseUp"
    @mousemove="mouseMove"
    v-on:touchstart.prevent.disablePassive="touchStart"
    v-on:touchmove.prevent.disablePassive="touchMove"
    :style="{ background: store.themes[store.currentTheme].bg }"></canvas>
</template>

<style>
.spravigator {
  width: 100%;
  image-rendering: pixelated;
  display: block;
}
</style>

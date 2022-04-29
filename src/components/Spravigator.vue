<script setup>
import { reactive, ref, onMounted } from 'vue'
import { usePxStore } from '../stores/PxStore.js'

const store = usePxStore()

const props = defineProps(['theme'])

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

function touchStart(e) {
  var rect = e.target.getBoundingClientRect();

  var tx = e.changedTouches[0].clientX - rect.left;
  var ty = e.changedTouches[0].clientY - rect.top;

  const x = Math.floor(tx/rect.width*9)
  const y = Math.floor(ty/rect.height*3)

  if (x < 0 || y < 0 ||
    x >= 9 || y >= 3) {
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

  const x = Math.floor(tx/rect.width*9)
  const y = Math.floor(ty/rect.height*3)

  if (x < 0 || y < 0 ||
    x >= 9 || y >= 3) {
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

  state.ctx.clearRect(0, 0, 81, 27)
  state.ctx.fillStyle = pxColor

  for (let y = 0; y < 27; y++) {
    for (let x = 0; x < 81; x++) {
      const v = store.px[y][x]
      if (v === 1) {
        state.ctx.fillRect(x,y,1,1)
      }
    }
  }

  state.ctx.globalCompositeOperation = 'destination-over'
  state.ctx.fillStyle = hlColor
  state.ctx.fillRect(store.pan[0]*9, store.pan[1]*9, 9, 9)
}
</script>

<template>
  <canvas ref="nav" class="spravigator" width="81" height="27" v-on:touchstart.prevent.disablePassive="touchStart" v-on:touchmove.prevent.disablePassive="touchMove" :style="{ background: store.themes[store.currentTheme].bg }"></canvas>
</template>

<style>
.spravigator {
  width: 100%;
  image-rendering: pixelated;
  display: block;
}
</style>

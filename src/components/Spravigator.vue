<script setup>
import { reactive, ref, onMounted } from 'vue'
import { usePxStore } from '../stores/PxStore.js'

const store = usePxStore()

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

  const x = Math.floor(tx/rect.width*8)
  const y = Math.floor(ty/rect.height*3)
  store.setPan(x,y)

  state.lastX = x
  state.lastY = y
}

function touchMove(e) {
  var rect = e.target.getBoundingClientRect();

  var tx = e.changedTouches[0].clientX - rect.left;
  var ty = e.changedTouches[0].clientY - rect.top;

  const x = Math.floor(tx/rect.width*8)
  const y = Math.floor(ty/rect.height*3)

  if (x !== state.lastX || y !== state.lastY) {
    store.setPan(x,y)
  }

  state.lastX = x
  state.lastY = y
}

function updateCanvas() {
  state.ctx.clearRect(0, 0, 64, 24)
  state.ctx.fillStyle = 'white'

  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 64; x++) {
      const v = store.px[y][x]
      if (v === 1) {
        state.ctx.fillRect(x,y,1,1)
      }
    }
  }

  state.ctx.globalCompositeOperation = 'destination-over'
  state.ctx.fillStyle = '#333'
  state.ctx.fillRect(store.pan[0]*8, store.pan[1]*8, 8, 8)
}
</script>

<template>
  <canvas ref="nav" class="spravigator" width="64" height="24" v-on:touchstart.prevent.disablePassive="touchStart" v-on:touchmove.prevent.disablePassive="touchMove">ok here</canvas>
</template>

<style>
.spravigator {
  background: #222;
  width: 100%;
  image-rendering: pixelated;
  display: block;
}
</style>

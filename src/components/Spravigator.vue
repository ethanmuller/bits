<script setup>
import { reactive, ref, onMounted } from 'vue'
import { usePxStore } from '../stores/PxStore.js'

const store = usePxStore()

store.$subscribe(updateCanvas)

const nav = ref(null)

const state = reactive({
  ctx: null,
})

onMounted(() => {
  state.ctx = nav.value.getContext('2d')

  updateCanvas()
})

function updateCanvas() {
  state.ctx.clearRect(0, 0, 8, 8)
  state.ctx.fillStyle = 'white'

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const v = store.px[y][x]
      if (v === 1) {
        state.ctx.fillRect(x,y,1,1)
      }
    }
  }
}
</script>

<template>
  <canvas ref="nav" class="spravigator" width="8" height="8">ok here</canvas>
</template>

<style>
.spravigator {
  background: #222;
  width: 8rem;
  image-rendering: pixelated;
}
</style>

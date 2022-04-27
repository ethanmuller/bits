import { defineStore } from "pinia";
import { io } from 'socket.io-client'



function createEmptyGrid(width, height) {
  const grid = new Array(height)

  for (let y = 0; y < height; y++) {
    grid[y] = []

    for (let x = 0; x < width; x++) {
      grid[y][x] = 0
    }
  }

  return grid
}

export const usePxStore = defineStore('main', {
  state() {
    return {
      px: createEmptyGrid(64, 64),
      socket: io(),
    }
  },
  actions: {
    pset(x,y,c) {
      this.px[y][x] = c
    },
    pget(x, y) {
      return this.px[y][x]
    },
  },
})

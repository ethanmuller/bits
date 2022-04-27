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
      px: createEmptyGrid(81, 81),
      socket: io(),
      pan: [0, 0],
    }
  },
  getters: {
  },
  actions: {
    pget(x, y) {
      if (this.px[y]) {
        return this.px[y + this.pan[1]*9][x + this.pan[0]*9]
      } else {
        return 0
      }
    },
    pset(x,y,c) {
      this.px[y][x] = c
    },
    setPan(x, y) {
      this.pan[0] = x
      this.pan[1] = y
    },
  },
})

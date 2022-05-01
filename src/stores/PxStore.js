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
      currentTheme: 'electric',
      themes: {
        electric: {
          fg: '#000',
          bg: '#fff',
          hl: '#fff000',
        },
        cute: {
          fg: '#ff8888',
          bg: '#ffeeee',
          hl: '#ffffff',
        },
        cloudy: {
          fg: '#fff',
          bg: '#aaa',
          hl: '#777',
        },
        energy: {
          fg: '#fff000',
          bg: '#00f',
          hl: '#33f',
        },
        santa: {
          fg: '#fff',
          bg: '#f00',
          hl: '#f88',
        },
        cyber: {
          fg: '#0f0',
          bg: '#000',
          hl: '#030',
        },
      }
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
    chunkSet(panX, panY, chunkPx) {
      for (let y = panY; y < chunkPx.length + panY; y++) {
        for (let x = panX; x < chunkPx.length + panX; x++) {
          this.pset(x, y, 1)
        }
      }
    },
    setPan(x, y) {
      this.pan[0] = x
      this.pan[1] = y
    },
    changeTheme(t) {
      this.currentTheme = t
    },
  },
})

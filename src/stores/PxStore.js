import { sfx } from '../Sfx.js'
import { defineStore } from "pinia";
import { io } from 'socket.io-client'
import { viewWidth, viewHeight, imageWidth, imageHeight } from '../dimensions'


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
      px: createEmptyGrid(imageWidth, imageHeight),
      clipboard: createEmptyGrid(viewWidth, viewHeight),
      socket: io(window.location.origin, {
        path: '/bitter/socket/',
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }),
      pan: [0,0],
      i: 0,
      currentTheme: 'electric',
      themes: {
        electric: {
          fg: '#000',
          bg: '#fff',
          hl: '#ffcc00',
        },
        cute: {
          fg: '#ff8888',
          bg: '#ffeeee',
          hl: '#ffffff',
        },
        cloudy: {
          fg: '#888',
          bg: '#fff',
          hl: '#ddd',
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
      for (let y = 0; y < chunkPx.length; y++) {
        for (let x = 0; x < chunkPx.length; x++) {
          this.pset(x + panX, y + panY, chunkPx[y][x])
        }
      }
    },
    setPan(x, y) {
      if (x < 0) {
        x = imageWidth/viewWidth-1
      }

      if (y < 0) {
        y = imageHeight/viewHeight-1
      }

      this.pan[0] = x % (imageWidth/viewWidth)
      this.pan[1] = y % (imageHeight/viewHeight)

      sfx.nav()
    },
    changeTheme(t) {
      this.currentTheme = t
    },
    clearView() {
      const f = new Array(9)

      for (let y = 0; y < 9; y++) {
        f[y] = []

        for (let x = 0; x < 9; x++) {
          f[y][x] = 0
        }
      }


      this.chunkSet(this.pan[0]*9, this.pan[1]*9, f)
    },
    cut() {
      for (let y = 0; y < this.clipboard.length; y++) {
        for (let x = 0; x < this.clipboard.length; x++) {
          this.clipboard[y][x] = this.px[y + this.pan[1]*9][x + this.pan[0]*9]
        }
      }

      this.clearView()
    }
  },
})

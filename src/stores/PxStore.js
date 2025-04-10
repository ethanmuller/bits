import { sfx } from '../Sfx.js'
import { defineStore } from "pinia"
import { io } from 'socket.io-client'
import { viewWidth, viewHeight, imageWidth, imageHeight } from '../dimensions'
import { useRoute } from 'vue-router';


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
    const route = useRoute();

    return {
      px: createEmptyGrid(imageWidth, imageHeight),
      clipboard: createEmptyGrid(viewWidth, viewHeight),
      socket: null,
      pan: [0,0],
      i: 0,
      room: route.path,
    }
  },
  persist: {
    pick: ['clipboard'],
  },
  getters: {
  },
  actions: {
    initializeSocket() {
      const route = useRoute();
      this.socket = io(window.location.origin, {
        path: '/bitter/socket/',
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          room: route.path,
        },
      });
    },
    disconnectSocket() {
      this.socket.disconnect();
    },
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
    cut() {
      for (let y = 0; y < this.clipboard.length; y++) {
        for (let x = 0; x < this.clipboard.length; x++) {
          this.clipboard[y][x] = this.px[y + this.pan[1]*viewWidth][x + this.pan[0]*viewHeight]
        }
      }

      this.clearView()
    },
    clearView() {
      const f = new Array(viewHeight)

      for (let y = 0; y < viewHeight; y++) {
        f[y] = []

        for (let x = 0; x < viewWidth; x++) {
          f[y][x] = 0
        }
      }

      this.chunkSet(this.pan[0]*viewWidth, this.pan[1]*viewHeight, f)
      this.socket.emit('chunkSet', this.pan[0]*viewWidth, this.pan[1]*viewHeight, f)
    },
  },
})



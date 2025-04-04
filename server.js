const fs = require('fs')
const socket = require("socket.io");
const path = require('path')
const express = require('express')
const { createServer: createViteServer } = require('vite')
const { sendMessage } = require('./discordBot')

const w = 89
const h = 89
let px
const PORT = 3333

let currentTheme = 'electric'

function resetPx() {
  px = new Array(h)

  for (let y = 0; y < h; y++) {
    px[y] = []

    for (let x = 0; x < w; x++) {
      pset(x, y, 0)
    }
  }
}
resetPx()


function chunkSet(panX, panY, chunkPx) {
  for (let y = 0; y < chunkPx.length; y++) {
    for (let x = 0; x < chunkPx.length; x++) {
      pset(x + panX, y + panY, chunkPx[y][x])
    }
  }
}

function pset(x, y, c) {
  px[y][x] = c
}

function pget(x, y) {
  return px[y][x]
}


async function createServer() {
  const app = express()

  // Configure Vite to use the same port
  const vite = await createViteServer({
    server: { 
      middlewareMode: 'html',
      port: PORT,
      strictPort: true // Force Vite to use our specified port
    }
  })
  // use vite's connect instance as middleware
  app.use(vite.middlewares)

  const server = app.listen(PORT)
  console.log(`listening on port ${PORT}`)
  const io = socket(server, {
    path: '/bitter/socket/',
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3333',
      methods: ["GET", "POST"]
    },
    transports: ['websocket']
  });
  

  io.on("connection", function (socket) {
    const clientsList = Array.from(io.sockets.sockets.keys());
    io.emit('player list', clientsList)
    console.log(`join ${socket.id} @ ${new Date().toLocaleString()}`);
    sendMessage(`${clientsList.length} user(s) connected: https://ethanmuller.com/bitter`)

    socket.on("join", function (cb) {
      const clientsList = Array.from(io.sockets.sockets.keys());
      cb({px, currentTheme, clientsList})
    });

    socket.on("clear", function (cb) {
      let out = ''

      for (let y = 0; y < h; y++) {
        out += '\n'

        for (let x = 0; x < w; x++) {
          out += pget(x,y) ? '#' : ' '
        }
      }

      console.log(`cleared by ${socket.id} @ ${new Date().toLocaleString()}`)

      resetPx()
      io.emit("updateAll", px);
    });

    socket.on("change theme", function (theme) {
      currentTheme = theme
      socket.broadcast.emit("theme changed", currentTheme);
    });

    socket.on("pset", function (x,y, pan, c) {
      pset(x+pan[0]*9, y+pan[1]*9, c)
      socket.broadcast.emit("updatePx", x,y,pan,c);
    });
    socket.on("chunkSet", function (panX, panY, chunkPx) {
      chunkSet(panX, panY, chunkPx)
      socket.broadcast.emit("updateChunk", panX, panY, chunkPx);
    })

    socket.on("sfx", function (sfk) {
      socket.broadcast.emit("sfx", sfk);
    })
    socket.on('disconnect', (reason) => {
      console.log(`disconnect: ${socket.id} @ ${new Date().toLocaleString()}, reason: ${reason}`)
      const clientsList = Array.from(io.sockets.sockets.keys());
      socket.broadcast.emit('player list', clientsList)
    })

  });
}

createServer()

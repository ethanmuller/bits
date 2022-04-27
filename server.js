const fs = require('fs')
const socket = require("socket.io");
const path = require('path')
const express = require('express')
const { createServer: createViteServer } = require('vite')

const w = 89
const h = 89
let px
const PORT = 3030

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


function pset(x, y, c) {
  px[y][x] = c
}

function pget(x, y) {
  return px[y][x]
}

async function createServer() {
  const app = express()


  // Create Vite server in middleware mode. This disables Vite's own HTML
  // serving logic and let the parent server take control.
  //
  // In middleware mode, if you want to use Vite's own HTML serving logic
  // use `'html'` as the `middlewareMode` (ref https://vitejs.dev/config/#server-middlewaremode)
  const vite = await createViteServer({
    server: { middlewareMode: 'ssr' }
  })
  // use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('/', (req, res) => {
    console.log('request')
    let template = fs.readFileSync(
      path.resolve(__dirname, 'index.html'),
      'utf-8'
    )
    res.send(template)
  })


  const server = app.listen(PORT)
  console.log(`listening on port ${PORT}`)
  const io = socket(server, {
    // allowEIO3: true,
    // cors: {credentials: true, origin: 'http://localhost:3000'},
  });

  io.on("connection", function (socket) {

    console.log(`join ${socket.id} @ ${new Date().toLocaleString()}`);

    socket.on("join", function (cb) {
      cb(px)
    });

    socket.on("clear", function (cb) {
      let out = ''

      for (let y = 0; y < h; y++) {
        out += '\n'

        for (let x = 0; x < w; x++) {
          out += pget(x,y) ? '#' : ' '
        }
      }

      console.log(out)
      console.log(`cleared by ${socket.id} @ ${new Date().toLocaleString()}`)

      resetPx()
      io.emit("updateAll", px);
    });

    socket.on("pset", function (x,y,c) {
      pset(x,y,c)
      socket.broadcast.emit("updatePx", x,y,c);
    });
  });
}

createServer()

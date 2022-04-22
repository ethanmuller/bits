// const app = require('express')();
// const http = require('http').Server(app);
// const io = require('socket.io')(http);
import express from 'express'
import http from 'http'
import io from 'socket.io'

const app = express()
const server = http.Server(app)
const x = io(server)



app.get('/api/hello', function(req, res) {
  res.json({ hello: "world" });
});

//Whenever someone connects this gets executed
io.on('connection', function(socket) {
   console.log('A user connected');

   //Whenever someone disconnects this piece of code executed
   socket.on('disconnect', function () {
      console.log('A user disconnected');
   });
});

http.listen(3030, function() {
   console.log('listening on *:3030');
});

export const handler = app;

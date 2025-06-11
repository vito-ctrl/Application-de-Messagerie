const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http');
const socketIo = require('socket.io');
const authRouter = require('./routes/authRoutes')

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('message', (data) => {
    console.log(`Message from ${socket.id}: ${data}`);
    socket.broadcast.emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRouter);

mongoose.connect('mongodb://127.0.0.1:27017/securisee')
.then(() => console.log('connected to mongodb'))
.catch((error) => console.error('failed to connect to mongodb', error))


const port = 3000
app.listen(port, () => {
    console.log(`Socket.IO and app listening on port ${port}`)
})
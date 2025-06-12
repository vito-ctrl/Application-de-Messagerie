require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRouter = require('./routes/authRoutes');
// Assure-toi de créer/importer ce fichier si nécessaire
// const messageRouter = require('./routes/messageRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// --- Socket.IO logic ---
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

// --- Fallback JWT secret ---
if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET not set. Using default for development.');
    process.env.JWT_SECRET = 'default_secret_key_for_development';
}

// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- Routes ---
app.use('/api/auth', authRouter);
// Décommente et définis ce routeur si tu l'utilises
// app.use('/api/messages', messageRouter);

// --- Error handling middleware ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server with Socket.IO listening on port ${PORT}`);
});

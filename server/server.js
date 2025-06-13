require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/messageModel');

const authRouter = require('./routes/authRoutes');
const messageRouter = require('./routes/messageRoutes');

const app = express();
const server = http.createServer(app);

// Store online users
const onlineUsers = new Map();

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/messages', messageRouter);

// Socket.IO
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user login
    socket.on('user_login', (data) => {
        const { userId } = data;
        onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} is now online`);
        io.emit('user_status_change', {
            userId,
            status: 'online'
        });
    });

    // Handle user logout
    socket.on('user_logout', (data) => {
        const { userId } = data;
        onlineUsers.delete(userId);
        console.log(`User ${userId} is now offline`);
        io.emit('user_status_change', {
            userId,
            status: 'offline'
        });
    });

    // Handle typing status
    socket.on('typing', (data) => {
        const { senderId, receiverId, isTyping } = data;
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user_typing', {
                senderId,
                isTyping
            });
        }
    });

    // Handle messages
    socket.on('message', async (data) => {
        console.log(`Message from ${socket.id}:`, data);

        if (data.event === 'send_message') {
            try {
                const { senderId, receiverId, content } = data.data;

                // Save message to database
                const message = new Message({
                    sender: senderId,
                    receiver: receiverId,
                    content: content,
                    read: false
                });

                await message.save();
                console.log('Message saved to database:', message);

                // Send to receiver if online
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', {
                        message,
                        senderId
                    });
                }

                // Send confirmation to sender
                socket.emit('message_sent', {
                    message,
                    receiverId
                });
            } catch (error) {
                console.error('Error saving message:', error);
                socket.emit('error', { message: 'Error saving message', error: error.message });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Find and remove the user from onlineUsers
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit('user_status_change', {
                    userId,
                    status: 'offline'
                });
                break;
            }
        }
    });
});

// Gestion du JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET non défini. Valeur par défaut utilisée pour le développement.');
    process.env.JWT_SECRET = 'default_secret_key_for_development';
}

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Lancement du serveur
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server with Socket.IO running on port ${PORT}`);
});

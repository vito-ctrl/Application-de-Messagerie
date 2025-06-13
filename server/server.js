const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const socketIo = require('socket.io')
const authRouter = require('./routes/authRoutes')
const { 
    socketAuth, 
    RoomManager, 
    MessageHandler, 
    ConnectionManager 
} = require('./middleware/socketMiddleware')

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS configuration
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRouter);

// Initialize utilities
const roomManager = new RoomManager(io);
const messageHandler = new MessageHandler(io, roomManager);
const connectionManager = new ConnectionManager();

// Socket.IO middleware
io.use(socketAuth);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.userId})`);
    
    // Add user to connection manager
    connectionManager.addUser(socket);
    
    // Join personal room
    socket.join(socket.userId);
    
    // Broadcast user online status
    socket.broadcast.emit('userOnline', {
        userId: socket.userId,
        user: {
            _id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email
        },
        status: 'online'
    });
    
    // Send connected users list to the new user
    socket.emit('connectedUsers', {
        users: connectionManager.getConnectedUsers()
    });
    
    // Room management events
    socket.on('joinRoom', (data) => {
        const { roomId, metadata } = data;
        roomManager.joinRoom(socket, roomId, metadata);
    });
    
    socket.on('leaveRoom', (data) => {
        const { roomId } = data;
        roomManager.leaveRoom(socket, roomId);
    });
    
    socket.on('getRoomUsers', (data) => {
        const { roomId } = data;
        const users = roomManager.getRoomUsers(roomId);
        socket.emit('roomUsers', { roomId, users });
    });
    
    socket.on('getUserRooms', () => {
        const rooms = roomManager.getUserRooms(socket.userId);
        socket.emit('userRooms', { rooms });
    });
    
    // Message handling events
    socket.on('privateMessage', (data) => {
        messageHandler.handlePrivateMessage(socket, data);
    });
    
    socket.on('roomMessage', (data) => {
        messageHandler.handleRoomMessage(socket, data);
    });
    
    socket.on('broadcast', (data) => {
        messageHandler.handleBroadcast(socket, data);
    });
    
    // Typing indicators
    socket.on('typing', (data) => {
        const { roomId, isTyping } = data;
        
        socket.to(roomId).emit('userTyping', {
            userId: socket.userId,
            user: socket.user,
            isTyping,
            timestamp: new Date()
        });
    });
    
    // Status updates
    socket.on('statusUpdate', (data) => {
        const { status } = data;
        
        connectionManager.updateUserStatus(socket.userId, status);
        
        socket.broadcast.emit('userStatusUpdate', {
            userId: socket.userId,
            user: socket.user,
            status
        });
    });
    
    // File sharing events
    socket.on('fileShare', (data) => {
        const { roomId, recipientId, fileData, fileName, fileSize } = data;
        
        const shareData = {
            senderId: socket.userId,
            sender: socket.user,
            fileData,
            fileName,
            fileSize,
            timestamp: new Date()
        };
        
        if (roomId) {
            socket.to(roomId).emit('fileReceived', { ...shareData, roomId });
        } else if (recipientId) {
            io.to(recipientId).emit('fileReceived', { ...shareData, recipientId });
        }
    });
    
    // Video/Audio call events
    socket.on('callUser', (data) => {
        const { recipientId, callType, offer } = data;
        
        io.to(recipientId).emit('incomingCall', {
            callerId: socket.userId,
            caller: socket.user,
            callType,
            offer
        });
    });
    
    socket.on('answerCall', (data) => {
        const { callerId, answer } = data;
        
        io.to(callerId).emit('callAnswered', {
            answeredBy: socket.userId,
            answer
        });
    });
    
    socket.on('rejectCall', (data) => {
        const { callerId } = data;
        
        io.to(callerId).emit('callRejected', {
            rejectedBy: socket.userId
        });
    });
    
    socket.on('endCall', (data) => {
        const { recipientId } = data;
        
        io.to(recipientId).emit('callEnded', {
            endedBy: socket.userId
        });
    });
    
    // WebRTC signaling
    socket.on('iceCandidate', (data) => {
        const { recipientId, candidate } = data;
        
        io.to(recipientId).emit('iceCandidate', {
            senderId: socket.userId,
            candidate
        });
    });
    
    // Notification events
    socket.on('sendNotification', (data) => {
        const { recipientId, title, message, type } = data;
        
        io.to(recipientId).emit('notification', {
            senderId: socket.userId,
            sender: socket.user,
            title,
            message,
            type,
            timestamp: new Date()
        });
    });
    
    // Custom events
    socket.on('customEvent', (data) => {
        console.log('Custom event received:', data);
        
        socket.emit('customEventResponse', {
            message: 'Custom event received successfully',
            originalData: data,
            timestamp: new Date()
        });
    });
    
    // Disconnect handling
    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.user.name} (${socket.userId}), Reason: ${reason}`);
        
        // Remove from connection manager
        connectionManager.removeUser(socket.userId);
        
        // Leave all rooms
        const userRooms = roomManager.getUserRooms(socket.userId);
        userRooms.forEach(room => {
            roomManager.leaveRoom(socket, room.roomId);
        });
        
        // Broadcast user offline status
        socket.broadcast.emit('userOffline', {
            userId: socket.userId,
            user: socket.user,
            status: 'offline'
        });
    });
    
    // Error handling
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        socket.emit('error', { message: 'An error occurred', error: error.message });
    });
});

// REST API endpoints
app.get('/api/socket/connected-users', (req, res) => {
    const users = connectionManager.getConnectedUsers();
    res.json({
        status: 'success',
        connectedUsers: users,
        count: users.length
    });
});

app.get('/api/socket/rooms', (req, res) => {
    const rooms = Array.from(roomManager.rooms.entries()).map(([roomId, room]) => ({
        roomId,
        userCount: room.users.size,
        users: Array.from(room.users),
        createdAt: room.createdAt,
        metadata: room.metadata
    }));
    
    res.json({
        status: 'success',
        rooms,
        count: rooms.length
    });
});

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/securisee')
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('Failed to connect to MongoDB', error))

const port = process.env.PORT || 3000
server.listen(port, () => {
    console.log(`Server listening on port ${port}`)
    console.log(`Socket.IO server ready`)
})
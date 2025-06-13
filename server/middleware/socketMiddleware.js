// socketMiddleware.js - Socket.IO middleware and utilities

const jwt = require('jsonwebtoken');
const User = require('../models/auth');

// Authentication middleware for Socket.IO
const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        
        const decoded = jwt.verify(token, 'scretkey123');
        const user = await User.findById(decoded._id).select('-password');
        
        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }
        
        socket.userId = user._id.toString();
        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
};

// Room management utilities
class RoomManager {
    constructor(io) {
        this.io = io;
        this.rooms = new Map(); // roomId -> { users: Set, createdAt: Date, metadata: {} }
    }
    
    createRoom(roomId, metadata = {}) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                users: new Set(),
                createdAt: new Date(),
                metadata
            });
        }
        return this.rooms.get(roomId);
    }
    
    joinRoom(socket, roomId, metadata = {}) {
        const room = this.createRoom(roomId, metadata);
        
        socket.join(roomId);
        room.users.add(socket.userId);
        
        // Notify other users in the room
        socket.to(roomId).emit('userJoinedRoom', {
            userId: socket.userId,
            user: socket.user,
            roomId,
            timestamp: new Date()
        });
        
        // Send room info to the joining user
        socket.emit('roomJoined', {
            roomId,
            users: Array.from(room.users),
            metadata: room.metadata
        });
        
        console.log(`User ${socket.userId} joined room: ${roomId}`);
    }
    
    leaveRoom(socket, roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            socket.leave(roomId);
            room.users.delete(socket.userId);
            
            // Notify other users in the room
            socket.to(roomId).emit('userLeftRoom', {
                userId: socket.userId,
                user: socket.user,
                roomId,
                timestamp: new Date()
            });
            
            // Clean up empty rooms
            if (room.users.size === 0) {
                this.rooms.delete(roomId);
                console.log(`Room ${roomId} deleted (empty)`);
            }
        }
        
        console.log(`User ${socket.userId} left room: ${roomId}`);
    }
    
    getRoomUsers(roomId) {
        const room = this.rooms.get(roomId);
        return room ? Array.from(room.users) : [];
    }
    
    getUserRooms(userId) {
        const userRooms = [];
        for (const [roomId, room] of this.rooms.entries()) {
            if (room.users.has(userId)) {
                userRooms.push({
                    roomId,
                    userCount: room.users.size,
                    metadata: room.metadata
                });
            }
        }
        return userRooms;
    }
}

// Message handler utilities
class MessageHandler {
    constructor(io, roomManager) {
        this.io = io;
        this.roomManager = roomManager;
    }
    
    handlePrivateMessage(socket, data) {
        const { recipientId, message, messageType = 'text' } = data;
        
        const messageData = {
            id: this.generateMessageId(),
            senderId: socket.userId,
            sender: socket.user,
            recipientId,
            message,
            messageType,
            timestamp: new Date(),
            type: 'private'
        };
        
        // Send to recipient
        this.io.to(recipientId).emit('privateMessage', messageData);
        
        // Send confirmation to sender
        socket.emit('messageDelivered', {
            messageId: messageData.id,
            recipientId,
            timestamp: messageData.timestamp
        });
        
        console.log(`Private message from ${socket.userId} to ${recipientId}`);
    }
    
    handleRoomMessage(socket, data) {
        const { roomId, message, messageType = 'text' } = data;
        
        const messageData = {
            id: this.generateMessageId(),
            senderId: socket.userId,
            sender: socket.user,
            roomId,
            message,
            messageType,
            timestamp: new Date(),
            type: 'room'
        };
        
        // Send to all users in the room except sender
        socket.to(roomId).emit('roomMessage', messageData);
        
        // Send confirmation to sender
        socket.emit('messageDelivered', {
            messageId: messageData.id,
            roomId,
            timestamp: messageData.timestamp
        });
        
        console.log(`Room message in ${roomId} from ${socket.userId}`);
    }
    
    handleBroadcast(socket, data) {
        const { message, messageType = 'text' } = data;
        
        const messageData = {
            id: this.generateMessageId(),
            senderId: socket.userId,
            sender: socket.user,
            message,
            messageType,
            timestamp: new Date(),
            type: 'broadcast'
        };
        
        // Send to all connected users except sender
        socket.broadcast.emit('broadcast', messageData);
        
        console.log(`Broadcast message from ${socket.userId}`);
    }
    
    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Connection status manager
class ConnectionManager {
    constructor() {
        this.connectedUsers = new Map();
    }
    
    addUser(socket) {
        this.connectedUsers.set(socket.userId, {
            socketId: socket.id,
            userId: socket.userId,
            user: socket.user,
            status: 'online',
            connectedAt: new Date(),
            lastSeen: new Date()
        });
    }
    
    removeUser(userId) {
        this.connectedUsers.delete(userId);
    }
    
    updateUserStatus(userId, status) {
        const user = this.connectedUsers.get(userId);
        if (user) {
            user.status = status;
            user.lastSeen = new Date();
        }
    }
    
    getConnectedUsers() {
        return Array.from(this.connectedUsers.values());
    }
    
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
    
    getUserSocket(userId) {
        const user = this.connectedUsers.get(userId);
        return user ? user.socketId : null;
    }
}

module.exports = {
    socketAuth,
    RoomManager,
    MessageHandler,
    ConnectionManager
};
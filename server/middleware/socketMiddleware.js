const jwt = require('jsonwebtoken');
const User = require('../models/auth');

// Authentication middleware for Socket.IO
const socketAuth = async (socket, next) => {
    try {
        console.log('🔐 Authenticating socket connection...');
        
        const token = socket.handshake.auth.token;
        
        if (!token) {
            console.error('❌ No token provided');
            return next(new Error('Authentication token required'));
        }

        console.log('🔍 Verifying token...');
        
        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, 'scretkey123');
        } catch (jwtError) {
            console.error('❌ Invalid token:', jwtError.message);
            return next(new Error('Invalid authentication token'));
        }

        // Find user in database
        const user = await User.findById(decoded._id).select('-password');
        
        if (!user) {
            console.error('❌ User not found');
            return next(new Error('User not found'));
        }

        // Attach user info to socket
        socket.user = user;
        socket.userId = user._id.toString();
        
        console.log('✅ Socket authenticated for user:', user.name, 'ID:', socket.userId);
        next();
        
    } catch (error) {
        console.error('❌ Socket authentication failed:', error.message);
        next(new Error('Authentication failed'));
    }
};

// Room Manager Class
class RoomManager {
    constructor(io) {
        this.io = io;
        this.rooms = new Map(); // roomId -> { users: Set, createdAt, metadata }
        this.userRooms = new Map(); // userId -> Set of roomIds
    }

    joinRoom(socket, roomId, metadata = {}) {
        try {
            console.log(`🏠 User ${socket.user.name} joining room: ${roomId}`);
            
            // Initialize room if it doesn't exist
            if (!this.rooms.has(roomId)) {
                this.rooms.set(roomId, {
                    users: new Set(),
                    createdAt: new Date(),
                    metadata: metadata
                });
            }

            const room = this.rooms.get(roomId);
            room.users.add(socket.userId);

            // Track user's rooms
            if (!this.userRooms.has(socket.userId)) {
                this.userRooms.set(socket.userId, new Set());
            }
            this.userRooms.get(socket.userId).add(roomId);

            // Join socket room
            socket.join(roomId);

            // Notify room about new user
            socket.to(roomId).emit('userJoinedRoom', {
                roomId,
                user: {
                    _id: socket.user._id,
                    name: socket.user.name,
                    email: socket.user.email
                },
                timestamp: new Date()
            });

            // Confirm to user
            socket.emit('roomJoined', {
                roomId,
                userCount: room.users.size,
                metadata: room.metadata
            });

            console.log(`✅ User ${socket.user.name} joined room ${roomId}`);
            
        } catch (error) {
            console.error('❌ Error joining room:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    }

    leaveRoom(socket, roomId) {
        try {
            const room = this.rooms.get(roomId);
            if (!room) return;

            room.users.delete(socket.userId);
            socket.leave(roomId);

            // Update user's rooms
            if (this.userRooms.has(socket.userId)) {
                this.userRooms.get(socket.userId).delete(roomId);
            }

            // Notify room about user leaving
            socket.to(roomId).emit('userLeftRoom', {
                roomId,
                user: {
                    _id: socket.user._id,
                    name: socket.user.name,
                    email: socket.user.email
                },
                timestamp: new Date()
            });

            // Clean up empty rooms
            if (room.users.size === 0) {
                this.rooms.delete(roomId);
            }

            console.log(`✅ User ${socket.user.name} left room ${roomId}`);
            
        } catch (error) {
            console.error('❌ Error leaving room:', error);
        }
    }

    getRoomUsers(roomId) {
        const room = this.rooms.get(roomId);
        return room ? Array.from(room.users) : [];
    }

    getUserRooms(userId) {
        const userRooms = this.userRooms.get(userId);
        if (!userRooms) return [];
        
        return Array.from(userRooms).map(roomId => {
            const room = this.rooms.get(roomId);
            return {
                roomId,
                userCount: room ? room.users.size : 0,
                metadata: room ? room.metadata : {}
            };
        });
    }
}

// Message Handler Class
class MessageHandler {
    constructor(io, roomManager) {
        this.io = io;
        this.roomManager = roomManager;
    }

    handlePrivateMessage(socket, data) {
        try {
            const { recipientId, message } = data;
            
            console.log(`📧 Private message from ${socket.user.name} to ${recipientId}`);
            
            if (!recipientId || !message) {
                console.error('❌ Missing recipientId or message');
                socket.emit('messageError', { error: 'Recipient ID and message are required' });
                return;
            }

            const messageData = {
                sender: {
                    _id: socket.user._id,
                    name: socket.user.name,
                    email: socket.user.email
                },
                message: message.trim(),
                timestamp: new Date(),
                type: 'private'
            };

            // Send to recipient
            this.io.to(recipientId).emit('privateMessage', messageData);
            
            // Confirm delivery to sender
            socket.emit('messageDelivered', {
                type: 'private',
                recipientId,
                timestamp: new Date()
            });

            console.log('✅ Private message delivered');
            
        } catch (error) {
            console.error('❌ Error handling private message:', error);
            socket.emit('messageError', { error: 'Failed to send private message' });
        }
    }

    handleRoomMessage(socket, data) {
        try {
            const { roomId, message } = data;
            
            console.log(`🏠 Room message from ${socket.user.name} to room ${roomId}`);
            
            if (!roomId || !message) {
                console.error('❌ Missing roomId or message');
                socket.emit('messageError', { error: 'Room ID and message are required' });
                return;
            }

            // Check if user is in the room
            const room = this.roomManager.rooms.get(roomId);
            if (!room || !room.users.has(socket.userId)) {
                console.error('❌ User not in room');
                socket.emit('messageError', { error: 'You are not in this room' });
                return;
            }

            const messageData = {
                sender: {
                    _id: socket.user._id,
                    name: socket.user.name,
                    email: socket.user.email
                },
                message: message.trim(),
                roomId,
                timestamp: new Date(),
                type: 'room'
            };

            // Send to all users in the room (including sender)
            this.io.to(roomId).emit('roomMessage', messageData);
            
            console.log('✅ Room message delivered');
            
        } catch (error) {
            console.error('❌ Error handling room message:', error);
            socket.emit('messageError', { error: 'Failed to send room message' });
        }
    }

    handleBroadcast(socket, data) {
        try {
            const { message } = data;
            
            if (!message) {
                socket.emit('messageError', { error: 'Message is required' });
                return;
            }

            const broadcastData = {
                sender: {
                    _id: socket.user._id,
                    name: socket.user.name,
                    email: socket.user.email
                },
                message: message.trim(),
                timestamp: new Date(),
                type: 'broadcast'
            };

            // Send to all connected users
            this.io.emit('broadcast', broadcastData);
            
            console.log('✅ Broadcast message sent');
            
        } catch (error) {
            console.error('❌ Error handling broadcast:', error);
            socket.emit('messageError', { error: 'Failed to send broadcast' });
        }
    }
}

// Connection Manager Class
class ConnectionManager {
    constructor() {
        this.connectedUsers = new Map(); // userId -> { user, socketId, status, connectedAt }
    }

    addUser(socket) {
        this.connectedUsers.set(socket.userId, {
            user: {
                _id: socket.user._id,
                name: socket.user.name,
                email: socket.user.email
            },
            socketId: socket.id,
            status: 'online',
            connectedAt: new Date()
        });
        
        console.log(`👥 User added to connections: ${socket.user.name}`);
    }

    removeUser(userId) {
        this.connectedUsers.delete(userId);
        console.log(`👥 User removed from connections: ${userId}`);
    }

    updateUserStatus(userId, status) {
        const user = this.connectedUsers.get(userId);
        if (user) {
            user.status = status;
            user.lastStatusUpdate = new Date();
        }
    }

    getConnectedUsers() {
        return Array.from(this.connectedUsers.entries()).map(([userId, data]) => ({
            userId,
            id: userId, // Add both for compatibility
            name: data.user.name,
            email: data.user.email,
            status: data.status,
            connectedAt: data.connectedAt
        }));
    }

    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }
}

module.exports = {
    socketAuth,
    RoomManager,
    MessageHandler,
    ConnectionManager
};
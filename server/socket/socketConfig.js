const Message = require('../models/messageModel');

function initializeSocket(io) {
    // Store online users
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Handle user login
        socket.on('user_login', (userId) => {
            onlineUsers.set(userId, socket.id);
            io.emit('user_status_change', {
                userId,
                status: 'online'
            });
        });

        // Handle user logout
        socket.on('user_logout', (userId) => {
            onlineUsers.delete(userId);
            io.emit('user_status_change', {
                userId,
                status: 'offline'
            });
        });

        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                const { senderId, receiverId, content } = data;

                // Save message to database
                const message = new Message({
                    sender: senderId,
                    receiver: receiverId,
                    content
                });
                await message.save();

                // Get receiver's socket ID
                const receiverSocketId = onlineUsers.get(receiverId);

                // Send message to receiver if online
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
                socket.emit('error', {
                    message: 'Error sending message',
                    error: error.message
                });
            }
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

        // Handle disconnection
        socket.on('disconnect', () => {
            let disconnectedUserId;
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    break;
                }
            }

            if (disconnectedUserId) {
                onlineUsers.delete(disconnectedUserId);
                io.emit('user_status_change', {
                    userId: disconnectedUserId,
                    status: 'offline'
                });
            }
        });
    });
}

module.exports = initializeSocket; 
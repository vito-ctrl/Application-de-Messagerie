const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// Get unread message count - This route must come before the chat history route
router.get('/unread/:userId', auth, messageController.getUnreadCount);

// Get messages between two users
router.get('/:userId1/:userId2', auth, messageController.getMessages);

// Mark messages as read
router.put('/read/:senderId/:receiverId', auth, messageController.markAsRead);

module.exports = router; 
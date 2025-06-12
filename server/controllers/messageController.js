const Message = require('../models/messageModel');

// Get messages between two users
exports.getMessages = async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 }
            ]
        })
            .sort({ timestamp: 1 })
            .populate('sender', 'username')
            .populate('receiver', 'username');

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const { senderId, receiverId } = req.params;
        await Message.updateMany(
            { sender: senderId, receiver: receiverId, read: false },
            { $set: { read: true } }
        );
        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking messages as read', error: error.message });
    }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await Message.countDocuments({
            receiver: userId,
            read: false
        });
        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ message: 'Error getting unread count', error: error.message });
    }
}; 
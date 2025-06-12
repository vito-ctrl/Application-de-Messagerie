// Message Schema
const messageSchema = new mongoose.Schema({
    roomCode: { type: String, required: true },
    sender: { type: String, required: true },
    senderUsername: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;  
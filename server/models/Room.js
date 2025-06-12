const roomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    createdBy: { type: String, required: true },
    participants: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
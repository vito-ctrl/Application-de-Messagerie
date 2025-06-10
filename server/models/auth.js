const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    admin:{
        type: String,
        default: "user"
    }
});

const user = mongoose.model('register', authSchema);
module.exports = user
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const feedbackSchema = new Schema({
    type: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    seen: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
}, {timestamps: true})

const Feedback = mongoose.model('feedback', feedbackSchema)
module.exports = Feedback

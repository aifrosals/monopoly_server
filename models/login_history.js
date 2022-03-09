const mongoose = require('mongoose')
const Schema = mongoose.Schema

const loginHistorySchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    login_date: {
        type: Date,
    },
    login_date_string: {
        type: String,
    }, 
}, {timestamps: true})

const LoginHistory = mongoose.model('login_history', loginHistorySchema)
module.exports = LoginHistory

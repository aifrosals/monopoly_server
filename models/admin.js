const mongoose = require('mongoose')
var Schema = mongoose.Schema

const AdminSchema = new Schema({
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    token: {
        type: String
    }

}, {timestamps: true})

var Admin = mongoose.model('admin', AdminSchema)
module.exports = Admin
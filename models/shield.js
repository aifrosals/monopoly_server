const mongoose = require('mongoose')
var Schema = mongoose.Schema

const ShieldSchema = new Schema({
    active: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date
    }
})

module.exports = ShieldSchema
const mongoose = require('mongoose')
var Schema = mongoose.Schema

const ShieldSchema = new Schema({
    value: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date
    }
})

module.exports = ShieldSchema
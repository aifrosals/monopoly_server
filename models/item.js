const mongoose = require('mongoose')
var Schema = mongoose.Schema

const ItemSchema = new Schema({
    step: {
        type: Number,
        default: 0
    },
    kick: {
        type: Number,
        default: 0
    }
}, {timestamps: true})

module.exports = ItemSchema
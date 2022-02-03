const mongoose = require('mongoose')
var Schema = mongoose.Schema

const BonusSchema = new Schema({
    active: {
        type: Boolean,
        default: false
    },
    moves: {
        type: Number,
        default: 0
    }
})

module.exports = BonusSchema

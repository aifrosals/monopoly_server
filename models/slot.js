const mongoose = require('mongoose')
var Schema = mongoose.Schema

var SlotSchema = new Schema({
    initial_type: {
        type: String,
    },
    current_type: {
        type: String,
        required: [true]
    },
    level: {
        type: Number
    },
    name: {
        type: String,
        required: [true, 'Need Slot name']
    },
    color: {
        type: String,
        required: [true]
    },
    index: {
        type: Number,
        required: [true]
    },
    land_price: {
        type: Number,
    },
    updated_price: {
        type: Number,
    },
    all_step_count: {
        type: Object
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },

}, { timestamps: true })

var Slot = mongoose.model('slots', SlotSchema)

module.exports = Slot;
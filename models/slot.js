const mongoose = require('mongoose')
var Schema = mongoose.Schema

var SlotSchema = new Schema ({
    initial_type: {
       type: String,
    },
    current_type: {
        type: String,
        required: [true]
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
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    }, 
  
}, {timestamps: true})

var Slot = mongoose.model('slots', SlotSchema)

module.exports = Slot;
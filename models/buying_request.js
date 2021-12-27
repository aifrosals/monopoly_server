const mongoose = require('mongoose')
var Schema = mongoose.Schema

var BuyingRequestSchema = new Schema({
    request_by: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    }, 
    request_to: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    slot_index: {
        type: Number,
    },
    selling_price: {
        type: Number
    },
    active: {
        type: Boolean,
    },
    seen: {
         type: Boolean,
    }

}, {timestamps: true})

var BuyingRequest = mongoose.model('buying_requests', BuyingRequestSchema)
module.exports = BuyingRequest
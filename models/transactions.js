const mongoose = require('mongoose')
var Schema = mongoose.Schema
const SlotSchema = require('./slot').SlotSchema

var TransactionSchema = new Schema({
    seller: {
        type: Schema.Types.ObjectId,
    },
    buyer: {
        type: Schema.Types.ObjectId,
    },
    seller_name: {
        type: String,   
    },
    buyer_name: {
        type: String,
    },
    slot: {
        type: Schema.Types.ObjectId,
        ref: 'slots'
    },
    child: SlotSchema,
    type: {
        type: String
    },
    amount: {
        type: Number
    }
}, {timestamps: true})

var Transaction = mongoose.model('transactions', TransactionSchema)

module.exports = Transaction
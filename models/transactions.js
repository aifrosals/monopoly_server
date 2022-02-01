const mongoose = require('mongoose')
var Schema = mongoose.Schema
const SlotSchema = require('./slot').SlotSchema

var TransactionSchema = new Schema({
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    seller_name: {
        type: String,   
    },
    buyer_name: {
        type: String,
    },
    actor : {
        type: Schema.Types.ObjectId,
        ref: 'users'
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
    },
    text: {
        type: String
    },
}, {timestamps: true})

var Transaction = mongoose.model('transactions', TransactionSchema)

module.exports = Transaction
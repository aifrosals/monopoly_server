const mongoose = require('mongoose')
var Schema = mongoose.Schema

var TransactionSchema = new Schema({
    seller: {
        type: Schema.Types.ObjectId,
    },
    buyer: {
        type: Schema.Types.ObjectId,
    },
    slot: {
        type: Schema.Types.ObjectId,
        ref: 'slots'
    },
    type: {
        type: String
    },
    amount: {
        type: Number
    }
}, {timestamps: true})

var Transaction = mongoose.model('transactions', TransactionSchema)

module.exports = Transaction
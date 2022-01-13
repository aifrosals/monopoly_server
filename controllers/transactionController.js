const mongoose = require('mongoose')
const User = require('../models/user')
const Slot = require('../models/slot')
const Transaction = require('../models/transactions')

exports.saveTransaction = async function (user, slot, type, amount) {
  try {
    var transaction = new Transaction()

    transaction.buyer = user
    transaction.slot = slot
    transaction.child = slot
    transaction.amount = amount
    transaction.buyer_name = user.id

    if (type == 'land') {
      transaction.type = 'land'
    }
    else if (type == 'seller') {
      transaction.seller = slot.owner
      transaction.seller_name = slot.owner.id
      transaction.type = 'seller'
    }
    else if (type == 'upgrade') {
      transaction.type = 'upgrade'
    }
    else if (type == 'half') {
      transaction.seller = slot.owner
      transaction.seller_name = slot.owner.id
      transaction.type = 'half'
    }

    else if (type == 'rent') {
      transaction.seller = slot.owner
      transaction.seller_name = slot.owner.id
      transaction.type = 'rent'
    }

    await transaction.save()

  } catch (error) {
    console.error('TransactionController saveTransaction', error)
    throw error
  }
}


exports.getTransactions = async function (req, res) {

  //TODO: Limit the transaction return and add pagination 

  try {
    var userId = mongoose.Types.ObjectId(req.body.userId)
    let transactions = await Transaction.find({ $or: [{ buyer: userId }, { buyer: userId, type: 'rent' }, { seller: userId, type: 'rent' }] }).populate({ path: 'child', populate: { path: 'owner', model: 'users' } }).sort({ createdAt: -1 });
    console.log('getTransaction transactions', transactions)
    return res.status(200).send(transactions)
  } catch (error) {
    console.error('TransactionController error', error)
    return res.status(400).send('error 400')
  }
}
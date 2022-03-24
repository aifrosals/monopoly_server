const mongoose = require('mongoose')
const User = require('../models/user')
const Slot = require('../models/slot')
const Transaction = require('../models/transactions')

const paginationLimit = 30



/**
 * Save a transaction by its type
 */
exports.saveTransaction = async function (user, slot, type, amount, owner) {
  try {
    var transaction = new Transaction()

    transaction.buyer = user
    transaction.slot = slot
    transaction.child = slot
    transaction.amount = amount
    transaction.buyer_name = user.id
    transaction.actor = user

    if (type == 'land') {
      transaction.type = 'land'
    }
    else if (type == 'seller') {
      transaction.seller = owner
      transaction.seller_name = owner.id
      transaction.type = 'seller'
    }
    else if (type == 'upgrade') {
      transaction.type = 'upgrade'
    }
    else if (type == 'half') {
      transaction.seller = owner
      transaction.seller_name = owner.id
      transaction.type = 'half'
    }

    else if (type == 'rent') {
      transaction.seller = slot.owner
      transaction.seller_name = slot.owner.id
      transaction.type = 'rent'
    }
    else if (type == 'reward') {
      transaction.type = 'reward'
    }
    else if (type == 'chest') {
      transaction.type = 'chest'
    }

    await transaction.save()

  } catch (error) {
    console.error('TransactionController saveTransaction', error)
    throw error
  }
}

/**
 * Get all transactions by user
 */
exports.getTransactions = async function (req, res) {

  try {
    const userId = mongoose.Types.ObjectId(req.body.userId)

    const transactions = await Transaction.find({
      $or: [{ buyer: userId },
      { buyer: userId, type: 'rent' },
      { seller: userId, type: 'rent' },
      { seller: userId, type: 'seller' },
      { seller: userId, type: 'half' }]
    }).populate({
      path: 'child',
      populate: { path: 'owner', model: 'users' }
    })
      .sort({ createdAt: -1 }).limit(paginationLimit);
    
    console.log('getTransaction transactions', transactions)
    return res.status(200).send(transactions)
  } catch (error) {
    console.error('TransactionController error', error)
    return res.status(400).send('error 400')
  }
}

exports.getPaginatedTransactions = async function (req, res) {
  try {
    console.log(req.body.lastDate)
    const lastDate = new Date(req.body.lastDate)
    console.log('getPaginatedTransactions lastDate', lastDate)
    const userId = mongoose.Types.ObjectId(req.body.userId)

    const transactions = await Transaction.find({
      $or: [{ buyer: userId },
      { buyer: userId, type: 'rent' },
      { seller: userId, type: 'rent' },
      { seller: userId, type: 'seller' },
      { seller: userId, type: 'half' }],
      createdAt: { $lt: lastDate }
    })
      .populate({
        path: 'child', populate:
        { path: 'owner', model: 'users' }
      })
      .sort({ createdAt: -1 }).limit(paginationLimit);

    console.log('getTransaction transactions', transactions)
    return res.status(200).send(transactions)
  } catch (error) {
    console.error('TransactionController error', error)
    return res.status(400).send('error 400')
  }
}
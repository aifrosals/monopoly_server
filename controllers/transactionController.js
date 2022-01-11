const User = require('../models/user')
const Slot = require('../models/slot')
const Transaction = require('../models/transactions')

exports.saveTransaction = async function(user, slot, type, amount) {
               try {
                    if(type == 'land') {
                      let transaction = new Transaction()
                      transaction.buyer = user
                      transaction.slot = slot
                      transaction.type = 'land'
                      transaction.amount = amount
                      await transaction.save()

                    }
                    else if(type == 'seller'){
                      let transaction = new Transaction()
                      transaction.buyer = user
                      transaction.slot = slot
                      transaction.seller = slot.owner
                      transaction.amount = amount
                      transaction.type = 'seller'
                      await transaction.save()

                    }
                    else if(type == 'upgrade') {
                        let transaction = new Transaction()
                        transaction.buyer = user
                        transaction.slot = slot
                        transaction.amount = amount
                        transaction.type = 'upgrade'
                        await transaction.save()
                    }
                    else if(type == 'half') {
                        let transaction = new Transaction()
                        transaction.buyer = user
                        transaction.slot = slot
                        transaction.seller = slot.owner
                        transaction.amount = amount
                        transaction.type = 'half'
                        await transaction.save()
                    }
                    
               } catch(error) {
                   console.error('TransactionController saveTransaction', error)
                   throw error
               }
}
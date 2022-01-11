const User = require('../models/user')
const Slot = require('../models/slot')
const Transaction = require('../models/transactions')

exports.saveTransaction = async function(user, slot, type, amount) {
               try {
                   var transaction = new Transaction()

                       transaction.buyer = user
                       transaction.slot = slot
                       transaction.child = slot
                       transaction.amount = amount
                       transaction.buyer_name = user.id

                    if(type == 'land') {
                      transaction.type = 'land'
                    }
                    else if(type == 'seller'){
                      transaction.seller = slot.owner
                      transaction.seller_name = slot.owner.id
                      transaction.type = 'seller'
                    }
                    else if(type == 'upgrade') {
                        transaction.type = 'upgrade'
                    }
                    else if(type == 'half') {
                        transaction.seller = slot.owner
                        transaction.seller_name = slot.owner.id
                        transaction.type = 'half'    
                    }

                    await transaction.save()
                    
               } catch(error) {
                   console.error('TransactionController saveTransaction', error)
                   throw error
               }
}
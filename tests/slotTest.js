const User = require('../models/user')
const slotController = require('../controllers/slotController')
const conn = require('../database/conn')


async function testGetRandomUserExceptCurrent() {
    await conn.main();
  var userResult = await User.findOne({id: 'user1'})
  var userResult2 = await User.aggregate([{$match: {_id: {$ne: userResult._id }}}, {$sample: {size:1}}])
  console.log('resulting user', userResult2)
}

 testGetRandomUserExceptCurrent()
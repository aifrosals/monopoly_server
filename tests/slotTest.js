const User = require('../models/user')
const slotController = require('../controllers/slotController')
const conn = require('../database/conn')
const Slot = require('../models/slot').Slot


async function testGetRandomUserExceptCurrent() {
    await conn.main();
  var userResult = await User.findOne({id: 'user1'})
  var userResult2 = await  User.aggregate([{$match: {$and:[{_id: {$ne: userResult._id }}, {"shield.active": false}]}}, {$sample: {size:1}}])
  console.log('resulting user', userResult2)
}

function getTenPercent(credits) {
  return Math.ceil(credits * 10 / 100)
}

async function lose10Percent() {
  await conn.main();
  var userResult = await User.findOne({id: 'user1'})
  var tenPercentCredits = getTenPercent(userResult.credits)
  var result = await User.findByIdAndUpdate({_id: userResult._id},  {
   $inc: {
     'credits': -tenPercentCredits
   }
 })
}


async function getShield(userResult) {
  await conn.main();
  var userResult = await User.findOne({id: 'user1'})
  var result = await User.findByIdAndUpdate({_id: userResult._id}, {$set:{"shield.active": true,"shield.date": new Date()}})  
}

async function offShield() {
  await conn.main();
  try {
  var userResult = await User.find({"shield.active": true})
  console.log('user results', userResult)
  for(var user of userResult) {
  const oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds
  const firstDate = user.shield.date
  console.log('shield activation date', firstDate)
  const secondDate = new Date(2022, 1, 6)
  const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay))
  console.log(diffDays)
  if(diffDays >= 3) {
     user.shield.active = false
     user.shield.date = undefined
     user.save()
  }
  }
} catch(error) {
  console.log('shield schedule error')
}
}


async function forceSell(userResult) {
  try {
    await conn.main()
    var userResult = await User.findOne({id: 'user1'})
    var slotResult = await Slot.findOne({$and:[{owner:userResult}, {status: "dkf"}]})
    console.log('slot result', slotResult)
  } catch(error) {
 
  }
 }

 async function addSlotsByUser() {
  await conn.main();
  const oldSlots = await Slot.find({})
  let propertySlots = []
  let newBoardSlots = []
  let newSlotCount = oldSlots.length + 7
  for(let i=0; i<oldSlots.length; i++){
    let slot = oldSlots[i]
    if(slot.initial_type == "land") {
       propertySlots.push(slot)
    }
  }
  let chestCount = (newSlotCount / 8).toFixed(0)
  let chestIndex = 8
  for(let i = 0; i < chestCount - 1; i++){
    if(chestCount < newSlotCount){
     newBoardSlots[chestIndex] = new Slot({
      index: chestIndex,
      name: "chest",
      current_type: "chest",
      initial_type: "chest",
     })
      chestIndex += 8
   } 
}
let chanceCount = (newSlotCount / 23).toFixed(0)
let chanceIndex = 23
for(let i = 0; i < chanceCount - 1; i++){
  if(chanceCount < newSlotCount){
   newBoardSlots[chanceCount] = new Slot({
    index: chanceIndex,
    name: "chest",
    current_type: "chest",
    initial_type: "chest",
   })
    chanceCount += 23
 } 
} 
}


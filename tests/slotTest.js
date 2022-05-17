const User = require('../models/user')
const slotController = require('../controllers/slotController')
const conn = require('../database/conn')
const Slot = require('../models/slot').Slot


async function testGetRandomUserExceptCurrent() {
  await conn.main();
  var userResult = await User.findOne({ id: 'user1' })
  var userResult2 = await User.aggregate([{ $match: { $and: [{ _id: { $ne: userResult._id } }, { "shield.active": false }] } }, { $sample: { size: 1 } }])
  console.log('resulting user', userResult2)
}

function getTenPercent(credits) {
  return Math.ceil(credits * 10 / 100)
}

async function lose10Percent() {
  await conn.main();
  var userResult = await User.findOne({ id: 'user1' })
  var tenPercentCredits = getTenPercent(userResult.credits)
  var result = await User.findByIdAndUpdate({ _id: userResult._id }, {
    $inc: {
      'credits': -tenPercentCredits
    }
  })
}


async function getShield(userResult) {
  await conn.main();
  var userResult = await User.findOne({ id: 'user1' })
  var result = await User.findByIdAndUpdate({ _id: userResult._id }, { $set: { "shield.active": true, "shield.date": new Date() } })
}

async function offShield() {
  await conn.main();
  try {
    var userResult = await User.find({ "shield.active": true })
    console.log('user results', userResult)
    for (var user of userResult) {
      const oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds
      const firstDate = user.shield.date
      console.log('shield activation date', firstDate)
      const secondDate = new Date(2022, 1, 6)
      const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay))
      console.log(diffDays)
      if (diffDays >= 3) {
        user.shield.active = false
        user.shield.date = undefined
        user.save()
      }
    }
  } catch (error) {
    console.log('shield schedule error')
  }
}


async function forceSell(userResult) {
  try {
    await conn.main()
    var userResult = await User.findOne({ id: 'user1' })
    var slotResult = await Slot.findOne({ $and: [{ owner: userResult }, { status: "dkf" }] })
    console.log('slot result', slotResult)
  } catch (error) {

  }
}

addSlotsByUser()
async function addSlotsByUser() {
  await conn.main();
  const oldSlots = await Slot.find({})
  let test = []
  test[23] = 6
  console.log(test)
  let propertySlots = []
  let newBoardSlots = []
  let newSlotCount = oldSlots.length + 7
  console.log(newSlotCount)
  for (let i = 0; i < oldSlots.length; i++) {
    let slot = oldSlots[i]
    if (slot.initial_type == "land") {
      propertySlots.push(slot)
    }
  }
  console.log('property slot', propertySlots)
  let chestCount = (newSlotCount / 8).toFixed(0)
  let chestIndex = 8
  for (let i = 0; i < chestCount; i++) {
    if (chestIndex < newSlotCount) {
      newBoardSlots[chestIndex] = new Slot({
        index: chestIndex,
        name: "Community Chest",
        current_type: "chest",
        initial_type: "chest",
        color: "#45818e"
      })
      chestIndex += 8
    }
  }
  let chanceCount = (newSlotCount / 23).toFixed(0)
  console.log(chanceCount)
  let chanceIndex = 23
  for (let i = 0; i < chanceCount; i++) {
    if (chanceIndex < newSlotCount) {
      newBoardSlots[chanceIndex] = new Slot({
        index: chanceIndex,
        name: "chance",
        current_type: "chance",
        initial_type: "chance",
        color: "#45818e"
      })
      chanceIndex += 23
    }
  }
  let treasureHuntIndex = parseInt(newSlotCount / 2)
  let blackHoleIndex = parseInt((newSlotCount / 2).toFixed(0)) + 1
  let wormHoleIndex = parseInt((newSlotCount / 2).toFixed(0)) + 2
  let rewardIndex = parseInt((newSlotCount / 2).toFixed(0)) - 1
  console.log(typeof wormHoleIndex)
  newBoardSlots[blackHoleIndex] = new Slot({
    index: blackHoleIndex,
    name: "Black Hole",
    current_type: "black_hole",
    initial_type: "black_hole",
    color: "#45818e"
  })
  newBoardSlots[wormHoleIndex] = new Slot({
    index: wormHoleIndex,
    name: "Worm Hole",
    current_type: "worm_hole",
    initial_type: "worm_hole",
    color: "#45818e"
  })
  newBoardSlots[rewardIndex] = new Slot({
    index: rewardIndex,
    name: "Reward RM 50",
    current_type: "reward",
    initial_type: "reward",
    color: "#3d17a0"
  })
  newBoardSlots[treasureHuntIndex] = new Slot({
    index: treasureHuntIndex,
    name: "Treasure Hunt",
    current_type: "treasure_hunt",
    initial_type: "treasure_hunt",
    color: "#3d17a0"
  })
  let emptySlots = 0
  let j = 0
  for (let i = 1; i < newSlotCount; i++) {
    if (newBoardSlots[i] == undefined) {
      console.log('undefined')
      if (j < propertySlots.length) {
        newBoardSlots[i] = propertySlots[j]
        newBoardSlots[i].index = i
        newBoardSlots[i].isNew = true
        j++
      }
      else {
        emptySlots++
      }
    }
  }
  console.log('undefined slots', emptySlots)
  console.log('property slot', propertySlots.length)
  for (let i = 0; i < newSlotCount - 1; i++) {
    if (newBoardSlots[i] == undefined) {
      newBoardSlots[i] = new Slot({
        index: i,
        name: "Land",
        current_type: "land",
        initial_type: "land",
        color: generateRandomSlotColor(),
        land_price: 50,
        level: 0
      })
    }
  }

  newBoardSlots[newSlotCount] = new Slot({
    index: newSlotCount,
    name: "Challenge",
    current_type: "challenge",
    initial_type: "challenge",
    color: "#2d3132"
  })
  newBoardSlots[0] = new Slot({
    index: 0,
    name: "Start",
    current_type: "start",
    initial_type: "start",
    color: "#f1c232"
  })

  newBoardSlots[newSlotCount + 1] = new Slot({
    index: newSlotCount + 1,
    name: "The End",
    current_type: "end",
    initial_type: "end",
    color: "#f1c232"
  })

  console.log(newBoardSlots.length)
  console.log(newBoardSlots)
  for (let i = 0; i < newBoardSlots.length; i++) {
    if(newBoardSlots[i] == undefined){
      newBoardSlots[i] = new Slot({
        index: i,
        name: "Land",
        current_type: "land",
        initial_type: "land",
        color: generateRandomSlotColor(),
        land_price: 50,
        level: 0
      })
    }
  }

  await Slot.deleteMany({})

  for(let slot of newBoardSlots){
    console.log('new slot a')
    console.log(slot)
    slot.save()
  }


}

function generateRandomSlotColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}


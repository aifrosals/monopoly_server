const mongoose = require('mongoose')

const User = require('../models/user');
const Slot = require('../models/slot').Slot;

const transactionController = require('../controllers/transactionController')

exports.getSlotSellingPrice = function (level) {
    let price = 0;
    switch (level) {
        case 0:
          {
            price = 1000;
          }
          break;
        case 1:
          {
            price = 1500;
          }
          break;
        case 2:
          {
            price = 2000;
          }
          break;
        case 3:
          {
            price = 3200;
          }
          break;
        case 4:
          {
            price = 4800;
          }
          break;
          case 5: {
              price = 6400;
          }
          break;
        default:
          {}
          break;
      }
      
      return price;
}

exports.getRandomPreviousSlot = function (index) {
  let limit = index - 1
  let randomPreviousSlot = Math.floor(Math.random() * limit)
  return randomPreviousSlot
}

exports.getCommunityChestCredits = function () {
  let num = Math.random()
  let credits = 0
  if(num <= 0.624) {
    let set = [5,10,15,20,25,30]  
    credits = set[Math.floor(Math.random() * 5)]
  }
  else if(num > 0.624 && num <= 0.926) {
    let set = [35,40,45,50]
    credits = set[Math.floor(Math.random() * 3)]
  }
  else if(num > 0.926) {
    credits = (Math.random() >= 0.5) ? 55 : 60
  }
   return credits
}

exports.upgradeSlot = async function (req, res) {
const session = await mongoose.startSession();
session.startTransaction();
try {
  var slotIndex = req.body.slotIndex;
  var userId = req.body.userId;
  var slotResult = await Slot.findOne({
    index: slotIndex,
  }).populate("owner", "id").session(session);
  console.log("upgradeSlot slot", slotResult)
  var userResult = await User.findOne({
    id: userId,
  }).session(session);
  console.log("slot id", slotResult.owner._id.toString());
  console.log("")

  if (slotResult.owner._id.toString() != userResult._id.toString()) {
    return res.status(400).send("This place is already bought by someone else");
  } else {
    var name;
    var price;
    var type = slotResult.current_type
    var level = slotResult.level
    var newType;
    var newLevel;

    switch (level) {
      case 0: {
        price = 100;
        name = 'House';
        newType = 'house'
        newLevel = 1
      }
      break;
    case 1: {
      price = 200;
      name = 'Shop';
      newType = 'shop'
      newLevel = 2
    }
    break;
    case 2: {
      price = 400;
      name = 'Condo';
      newType = 'condo'
      newLevel = 3
    }
    break;
    case 3: {
      price = 800;
      let randomSlot = getRandomSlotName()
      name = randomSlot.name;
      newType = randomSlot.type;
      newLevel = 4
    }
    break;
    case 4: {
      price = 1600;
      name = 'City';
      newType = 'city'
      newLevel = 5
    }
    break;
    default: {}
    break;
    }

    if (price == null || name == null || newType == null || newLevel == null) {
      return res.status(401).send('Something went wrong')
    }

    slotResult.updated_price = price
    slotResult.name = name
    slotResult.current_type = newType
    slotResult.level = newLevel

    console.log('updated slot', slotResult)

    slotResult.owner = userResult;

    userResult.credits = userResult.credits - slotResult.updated_price;
    await userResult.save();
    await slotResult.save();
    await transactionController.saveTransaction(userResult, slotResult, 'upgrade', price)

    await session.commitTransaction();
    return res.status(200).send(userResult);
  }
} catch (error) {
  console.error("upgradeSlot error", error);
  await session.abortTransaction()
  return res.status(402).send("Something went wrong 402");
} finally {
  console.log("finally is being called 3");
  session.endSession();
}
}

var slot_names = [{
  name: 'Business Center',
  type: 'business_center'
},
{
  name: 'Theme Park',
  type: 'theme_park'
}
]

function getRandomSlotName() {
let i = (Math.random() >= 0.5) ? 1 : 0
return slot_names[i]
}
const User = require('../models/user')
const mongoose = require('mongoose')

exports.login = async function(req, res) {
  try {
    var result = await User.findOne({
      id: req.body.id,
    }).exec();

    console.log("user login result", result);
    console.log("login gets called", req.body.id);
    return res.status(200).send(result);
  } catch (error) {
    console.error("login error", error);
    return res.status(400).send("something went wrong");
  }
}


exports.kickUser = async function(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.body.id
    var user = await User.findById(id).session(session);
    if(!user) {
      return res.status(400).send("user not found")
    }
    if(user.items.kick == 0) {
      return res.status(401).send("you don't have kick")
    }
    const result = await User.aggregate([{$match:{$and:[{"shield.active":false},{presence:"offline"}]}},{$sample:{size:1}}]).session(session)
    if(!result[0]) {
      return res.status(402).send("no user to kick")
    }
  
    var kickUser = await User.findByIdAndUpdate(result[0]._id).session(session)
    if(!kickUser || kickUser.presence == "online") { 
      return res.status(403).send("no user to kick")
    }
    if(kickUser.current_slot >= 49) {
      kickUser.current_slot = kickUser.current_slot - 49
    } else {
      kickUser.current_slot = 0
    }
    if(user.items.kick > 0) {
      user.items.kick -= 1
    }
    await user.save()
    await kickUser.save()
    await session.commitTransaction()
    return res.status(200).send(user)
  } catch(error) {
    console.error("kick user error", error)
    await session.abortTransaction();
    return res.status(405).send("something went wrong")
  }
}

exports.useStep = async function(req, res) {
  try {
    const id = req.body.id  
    var user = await User.findById(id)
    if(!user) {
      return res.status(400).send("user not found")
    }
    if(user.items.step == 0) {
      return res.status(401).send("you don't have step")
    }
    user.items.step -= 1
    await user.save()
    return res.status(200).send(user)
  } catch(error) {
    console.error("use step error", error)
    return res.status(405).send("something went wrong")
  }
}


exports.getDailyDice = async function() {
  try {
  var result = await User.updateMany({},  { $inc: {
    'dice': 5 }
  })
  console.log('dices have been updated', result)
} catch(error) {
  console.error('UserController getDailyDice error', error)
}
}

//TODO: add cash rm 

/**
 * Get bundle rewards when a user reached the end slot.
 * Bundle rewards include 150 credits 1 random item and
 * 5 RM cash
 * @param {User} userResult 
 */
 exports.getBundleReward = function (userResult) {
  try {
     userResult.credits = userResult.credits + 150
     userResult.items = getRandomItem(userResult.items)
     userResult.dice = userResult.dice + 20

     return userResult
  } catch(error) {
    console.log('getBundleReward error', error)
    throw error
  }
  }

function getRandomItem(items) {
    const i = Math.random() >= 0.5 ? 1 : 0;
    if(i == 0) {
      items.step = items.step + 1
    }
    else {
      items.kick = items.kick + 1
    }
    return items
}

exports.moveBack = async function(user) {
  try {
    console.log('user received', user)
    const id = mongoose.Types.ObjectId(user.serverId)
    let result = await User.findByIdAndUpdate(id, {current_slot: user.current_slot}, {new: true})
    console.log('current position', result.current_slot)
    return result
  } catch(error) {
    console.error('UserController moveBack error', error)
  }
}

exports.getTreasureHuntReward = async function(req, res) {
  try {
    const id = req.body.id
    const rewardFactor = req.body.rewardFactor
    var user = await User.findById(id)
    if(!user) {
      return res.status(400).send("user not found")
    }
    const rewards = getTreasureHuntRewardWithFactor(user, rewardFactor) 
    if(!rewards) {
      return res.status(401).send("no rewards")
    }
    const userResult = await User.findByIdAndUpdate(id, {items: rewards.items, $inc: {credits: rewards.credits}}, {new: true})
    
    return res.status(200).send({user: userResult, message: `Congratulations you got ${rewards.credits} credits and ${rewards.itemSize} items`})

  } catch(error) {
    console.error('UserController getTreasureHuntReward error', error)
    return res.status(405).send('something went wrong')
  }
}

exports.loseTreasureHunt = async function(req, res) {
  try {
    const id = req.body.id
    const userResult = await User.findByIdAndUpdate(id, {credits: 0}, {new: true})
    return res.status(200).send(userResult)
  } catch(error) {
    console.error('UserController loseTreasureHunt error', error)
    return res.status(405).send('something went wrong')
  }
}

function getRandomItemsWithSize(items, size) {
  var items
  for(var i = 0; i < size; i++) {
    items = getRandomItem(items)
  }
  return items
}

function getTreasureHuntRewardWithFactor(user, rewardFactor) {
  try {
   switch(rewardFactor) { 
      case 1:
        return {
          credits: 30,
          items: getRandomItem(user.items),
          itemSize: 1
        }
      case 2:
        { 
        return {
          credits: 130,
          items: getRandomItemsWithSize(user.items, 3),
          itemSize: 3
        }
      }
      case 3:
        { 
        return {
          credits: 630,
          items: getRandomItemsWithSize(user.items, 6),
          itemSize: 6
        }
      }
      case 4:
        { 
        return {
          credits: 2130,
          items: getRandomItemsWithSize(user.items, 10),
          itemSize: 10
        }
      }
      case 5:
        { 
        return {
          credits: 7130,
          items: getRandomItemsWithSize(user.items, 15),
          itemSize: 15
        }
      }
      case 6:
        { 
        return {
          credits: 27130,
          items: getRandomItemsWithSize(user.items, 21),
          itemSize: 21
        }
      }
    default:
      return null
    }

  } catch(error) {
    console.error('UserController getTreasureHuntRewardWithFactor error', error)
    throw error
  }
}

  
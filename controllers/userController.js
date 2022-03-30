const mongoose = require('mongoose')
const User = require('../models/user')
const LoginHistory = require('../models/login_history')
const uug = require('unique-username-generator')
require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.login = async function (req, res) {
  try {

    var result = await User.findOne({
      id: req.body.id
    }).exec()

    console.log('user login result', result);
    console.log('login gets called', req.body.id)
    res.status(200).send(result)
  } catch (error) {
    console.error('login error', error)
    return res.status(405).send('Server error')
  }
}

exports.loginWithToken = async function (req, res) {
  try {
    const token = req.body.token
    if (!token) {
      return res.status(401).send('Authentication error sign in again')
    }
    const user = await User.findOne({ token: token })
    if (!user) {
      return res.status(402).send('Authentication error sign in again')
    }
    await saveLoginHistory(user)
    checkWeeklyLogin(user)
    return res.status(200).send(user)
  } catch (error) {
    console.error('loginWithToken error', error)
    return res.status(405).send('Error while login')
  }
}

exports.registerGuest = async function (req, res) {
  try {
    let userName = 'Guest'
    let autoId = await User.countDocuments() + 1
    userName = userName + autoId.toString().padStart(3, '0')
    let encryptedPassword = await bcrypt.hash(userName, 10)
    let guest = await User.create({ id: userName, presence: "offline", current_slot: 0, dice: 10, password: encryptedPassword, bonus: {}, shield: {}, premium: false, items: {} })
    let token = jwt.sign({ user_id: guest._id }, process.env.TOKEN_KEY, { expiresIn: '365d' })
    guest.token = token
    await guest.save()
    await saveLoginHistory(guest)
    checkWeeklyLogin(guest)
    return res.status(200).send(guest)
  } catch (error) {
    console.log(error)
    return res.status(405).send('Server Error')
  }
}

exports.registerUserWithEmail = async function (req, res) {
  try {
    console.log("registerUserWithEmail", req.body)
    const { email, id, password, confirmPassword } = req.body
    console.log('username', id)
    if (email && id && password && confirmPassword) {
      if (password !== confirmPassword) {
        return res.status(400).send('Password and confirm password does not match')
      }
      if (!(await checkUserNameAndEmail(id, email))) {
        return res.status(401).send("username or email already exists")
      }

      let encryptedPassword = await bcrypt.hash(password, 10)

      let user = await User.create({ id: id, presence: "offline", current_slot: 0, dice: 10, password: encryptedPassword, email: email.toLowerCase(), bonus: {}, shield: {}, premium: false, items: {} })
      let token = jwt.sign({ user_id: user._id, email}, process.env.TOKEN_KEY, { expiresIn: '365d' })
      user.token = token
      await user.save()
      await saveLoginHistory(user)
      checkWeeklyLogin(user)
      return res.status(200).send(user)

    }
    return res.status(400).send('Error in details')


  } catch (error) {
    console.log(error)
    return res.status(405).send('Server Error')
  }
}

exports.registerGuestWithEmail = async function (req, res) {
  try {
    console.log("registerGuestWithEmail", req.body)
    const { email, id, password, confirmPassword, serverId } = req.body
    console.log('username', id)
    if (email && id && password && confirmPassword) {
      if (password !== confirmPassword) {
        return res.status(400).send('Password and confirm password does not match')
      }
      if (!(await checkUserNameAndEmail(id, email))) {
        return res.status(401).send("username or email already exists")
      }
      let encryptedPassword = await bcrypt.hash(password, 10)

      let user = await User.findByIdAndUpdate(serverId, { id: id, password: encryptedPassword, email: email.toLowerCase(), guest: false},{new: true})
      let token = jwt.sign({ user_id: user._id, email}, process.env.TOKEN_KEY, { expiresIn: '2d' })
      user.token = token
      await user.save()
      await saveLoginHistory(user)
      checkWeeklyLogin(user)
      return res.status(200).send(user)
    }
    return res.status(400).send('Error in details')
  } catch(error) {
      console.log(error)
      return res.status(405).send('Server Error')
    }
  }


async function checkUserNameAndEmail(userName, email) {
  try {
  
    const result = await User.findOne({ $or: [{ id: userName }, { email: email.toLowerCase() }] }).count()
    console.log('checkUserName', result)
    if (result == 0) {

      return true
    }
    else {
      return false
    }


  } catch (error) {
    throw error
  }
}




async function getRandomUserName() {
  try {
    let userName
    let result
    do {
      console.log('working')
      userName = uug.generateUsername("_", 0, 13)
      result = await User.findOne({ id: userName }).count()
      console.log(result)
    } while (result != 0)
    return userName
  } catch (error) {
    throw error
  }
}


exports.loginWithEmail = async function (req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).send("missing email or password")
    }

    const user = await User.findOne({
      email: email,
    })
    if (user && (await bcrypt.compare(password, user.password))) {
      let token = jwt.sign({ user_id: user._id, email }, process.env.TOKEN_KEY, { expiresIn: '365d' })
      user.token = token
      await user.save()
      await saveLoginHistory(user)
      checkWeeklyLogin(user)
      console.log("user login result", user);
      return res.status(200).send(user);
    }
    return res.status(401).send("invalid email or password")
  } catch (error) {
    console.error("login error", error);
    return res.status(405).send("something went wrong");
  }
}

exports.getAllUsers = async function (req, res) {
  try {
    const users = await User.find({})
    return res.status(200).send(users)
  } catch (error) {
    console.error('getAllUsers error', error)
    return res.status(405).return('Server error')
  }
}

exports.activatePremium = async function (req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.body.id, { $set: { premium: true } }, { new: true })
    return res.status(200).send(user)
  } catch (error) {
    console.error('activatePremium error', error)
    return res.status(405).return('Server error')
  }
}

exports.deactivatePremium = async function (req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.body.id, { $set: { premium: false } }, { new: true })
    return res.status(200).send(user)
  } catch (error) {
    console.error('deactivatePremium error', error)
    return res.status(405).return('Server error')
  }
}

exports.addDices = async function (req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.body.id, { $inc: { dice: req.body.dices } }, { new: true })
    return res.status(200).send(user)
  } catch (error) {
    console.error('addDices error', error)
    return res.status(405).return('Server error')
  }
}

exports.kickUser = async function (req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.body.id
    var user = await User.findById(id).session(session);
    if (!user) {
      return res.status(400).send("user not found")
    }
    if (user.items.kick == 0) {
      return res.status(401).send("you don't have kick")
    }
    const result = await User.aggregate([{ $match: { $and: [{ "shield.active": false }, { presence: "offline" }] } }, { $sample: { size: 1 } }]).session(session)
    if (!result[0]) {
      return res.status(402).send("no user to kick")
    }

    var kickUser = await User.findByIdAndUpdate(result[0]._id).session(session)
    if (!kickUser || kickUser.presence == "online") {
      return res.status(403).send("no user to kick")
    }
    if (kickUser.current_slot >= 49) {
      kickUser.current_slot = kickUser.current_slot - 49
    } else {
      kickUser.current_slot = 0
    }
    if (user.items.kick > 0) {
      user.items.kick -= 1
    }
    await user.save()
    await kickUser.save()
    await session.commitTransaction()
    return res.status(200).send(user)
  } catch (error) {
    console.error("kick user error", error)
    await session.abortTransaction();
    return res.status(405).send("something went wrong")
  }
}

exports.useStep = async function (req, res) {
  try {
    const id = req.body.id
    var user = await User.findById(id)
    if (!user) {
      return res.status(400).send("user not found")
    }
    if (user.items.step == 0) {
      return res.status(401).send("you don't have step")
    }
    user.items.step -= 1
    await user.save()
    return res.status(200).send(user)
  } catch (error) {
    console.error("use step error", error)
    return res.status(405).send("something went wrong")
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
    userResult.cash = userResult.cash + 5
    userResult.items = getRandomItem(userResult.items)
    userResult.dice = userResult.dice + 20

    return userResult
  } catch (error) {
    console.log('getBundleReward error', error)
    throw error
  }
}

function getRandomItem(items) {
  const i = Math.random() >= 0.5 ? 1 : 0;
  if (i == 0) {
    items.step = items.step + 1
  }
  else {
    items.kick = items.kick + 1
  }
  return items
}

exports.moveBack = async function (user) {
  try {
    console.log('user received', user)
    const id = mongoose.Types.ObjectId(user.serverId)
    let result = await User.findByIdAndUpdate(id, { current_slot: user.current_slot }, { new: true })
    console.log('current position', result.current_slot)
    return result
  } catch (error) {
    console.error('UserController moveBack error', error)
  }
}

exports.getTreasureHuntReward = async function (req, res) {
  try {
    const id = req.body.id
    const rewardFactor = req.body.rewardFactor
    var user = await User.findById(id)
    if (!user) {
      return res.status(400).send("user not found")
    }
    const rewards = getTreasureHuntRewardWithFactor(user, rewardFactor)
    if (!rewards) {
      return res.status(401).send("no rewards")
    }
    const userResult = await User.findByIdAndUpdate(id, { items: rewards.items, $inc: { credits: rewards.credits } }, { new: true })

    return res.status(200).send({ user: userResult, message: `Congratulations you got ${rewards.credits} credits and ${rewards.itemSize} items` })

  } catch (error) {
    console.error('UserController getTreasureHuntReward error', error)
    return res.status(405).send('something went wrong')
  }
}

exports.loseTreasureHunt = async function (req, res) {
  try {
    const id = req.body.id
    const userResult = await User.findByIdAndUpdate(id, { credits: 0 }, { new: true })
    return res.status(200).send(userResult)
  } catch (error) {
    console.error('UserController loseTreasureHunt error', error)
    return res.status(405).send('something went wrong')
  }
}

function getRandomItemsWithSize(items, size) {
  var items
  for (var i = 0; i < size; i++) {
    items = getRandomItem(items)
  }
  return items
}

function getTreasureHuntRewardWithFactor(user, rewardFactor) {
  try {
    switch (rewardFactor) {
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

  } catch (error) {
    console.error('UserController getTreasureHuntRewardWithFactor error', error)
    throw error
  }
}

async function saveLoginHistory(user) {
  try {
    let date = new Date()
    date.setHours(0, 0, 0, 0)
    const loginHistoryResult = await LoginHistory.findOneAndUpdate({ login_date_string: new Date().toLocaleDateString(), user_id: user._id }, {
      user_id: user._id,
      login_date: date,
      login_date_string: new Date().toLocaleDateString()
    }, { upsert: true })


  } catch (error) {
    console.error('UserController saveUserLogin error', error)
    throw error
  }
}

async function checkWeeklyLogin(user) {
  try {
    const loginHistoryResult = await LoginHistory.find({ user_id: user._id }).sort({ 'createdAt': -1 }).select('login_date').limit(7).lean()
    if (loginHistoryResult) {
      console.log('login history', loginHistoryResult)
    }
  } catch (error) {
    console.error('UserController checkWeeklyLogin error', error)
    throw error
  }
}



exports.disableShield = async function () {
  try {
    console.log('hourly disableShield activated')
    var userResult = await User.find({ "shield.active": true })
    console.log('user results', userResult)
    for (var user of userResult) {
      const oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds
      const firstDate = user.shield.date
      console.log('shield activation date', firstDate)
      const secondDate = new Date()
      const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay))
      console.log(diffDays)
      if (diffDays >= 3) {
        user.shield.active = false
        user.shield.date = undefined
        user.save()
      }
    }
  } catch (error) {
    console.log('shield schedule error', error)
  }
}

exports.getHourlyDicePremium = async function () {
  try {
    console.log('hourly getHourlyDicePremium activated')
    var userResult = await User.find({ premium: true })
    console.log('user results', userResult)
    for (var user of userResult) {
      try {
        if (user.dice < 16)
          user.dice += 1
        user.dice_updated_at = new Date()
        user.save()
      } catch (error) {
        console.log('getHourlyDicePremium singular error', error)
      }
    }
  } catch (error) {
    console.log('dice schedule error', error)
  }
}

exports.getHourlyDiceRegular = async function () {
  try {
    console.log('hourly getHourlyDiceRegular activated')
    var userResult = await User.find({ premium: false })
    console.log('user results', userResult)
    for (var user of userResult) {
      try {
        if (user.dice < 10)
          user.dice += 1
        user.dice_updated_at = new Date()
        user.save()
      } catch (error) {
        console.error('getHourlyDiceRegular singular error', error)
      }
    }
  } catch (error) {
    console.error('getHourlyDiceRegular error', error)
  }
}

exports.getItemsMonthly = async function () {
  try {
    console.log('getItemsMonthly activated')
    var userResult = await User.find({})
    console.log('user results', userResult)
    for (var user of userResult) {
      try {
        if (user.premium) {
          user.items = getRandomItemsWithSize(user.items, 2)
          user.items_updated_at = new Date()
          user.save()
        }
        else {
          user.items = getRandomItem(user.items)
          user.items_updated_at = new Date()
          user.save()
        }

      } catch (error) {
        console.error('getItemsMonthly singular error', error)
      }
    }
  } catch (error) {
    console.error('getItemsMonthly error', error)
  }
}
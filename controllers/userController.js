const User = require('../models/user')

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
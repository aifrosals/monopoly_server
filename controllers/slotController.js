const mongoose = require("mongoose");

const User = require("../models/user");
const Slot = require("../models/slot").Slot;

const transactionController = require("../controllers/transactionController");

/**
 * Get the selling price of the slot (property) based on level
 * @param {Number} level
 * @returns {Number} selling price
 */
getSlotSellingPrice = function (level) {
  let price = 0;
  switch (level) {
    case 0: {
      price = 1000;
    }
    break;
  case 1: {
    price = 1500;
  }
  break;
  case 2: {
    price = 2000;
  }
  break;
  case 3: {
    price = 3200;
  }
  break;
  case 4: {
    price = 4800;
  }
  break;
  case 5: {
    price = 6400;
  }
  break;
  default: {}
  break;
  }

  return price;
};

/**
 * Get credits based on the probability
 * @returns {Number} credits
 */
exports.getCommunityChestCredits = function () {
  let num = Math.random();
  let credits = 0;
  if (num <= 0.624) {
    let set = [5, 10, 15, 20, 25, 30];
    credits = set[Math.floor(Math.random() * 5)];
  } else if (num > 0.624 && num <= 0.926) {
    let set = [35, 40, 45, 50];
    credits = set[Math.floor(Math.random() * 3)];
  } else if (num > 0.926) {
    credits = Math.random() >= 0.5 ? 55 : 60;
  }
  return credits;
};

//TODO: Use lean for more performance
/**
 *
 * @param {Object} res
 * @returns {Array || String} all slots from slots collection or error message
 */
exports.getSlots = async function (req, res) {
  try {
    var result = await Slot.find().populate("owner", "id").sort("index");
    console.log("slots from db", result);
    return res.status(200).send(result);
  } catch (error) {
    console.error("getSlot error", error);
    return res.status(400).send("something went wrong");
  }
};

/**
 * Upgrade the owned slot
 * @param {Object} req slotIndex : String and userId : String
 * @param {Object} res
 * @returns {Object || String} returns either uer object or String message with status
 */
exports.upgradeSlot = async function (req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    var slotIndex = req.body.slotIndex;
    var userId = req.body.userId;
    var slotResult = await Slot.findOne({
        index: slotIndex,
      })
      .populate("owner", "id")
      .session(session);
    console.log("upgradeSlot slot", slotResult);
    var userResult = await User.findOne({
      id: userId,
    }).session(session);
    console.log("slot id", slotResult.owner._id.toString());
    console.log("");

    if (slotResult.owner._id.toString() != userResult._id.toString()) {
      return res
        .status(400)
        .send("This place is already bought by someone else");
    } else {
      var name;
      var price;
      var type = slotResult.current_type;
      var level = slotResult.level;
      var newType;
      var newLevel;

      switch (level) {
        case 0: {
          price = 100;
          name = "House";
          newType = "house";
          newLevel = 1;
        }
        break;
      case 1: {
        price = 200;
        name = "Shop";
        newType = "shop";
        newLevel = 2;
      }
      break;
      case 2: {
        price = 400;
        name = "Condo";
        newType = "condo";
        newLevel = 3;
      }
      break;
      case 3: {
        price = 800;
        let randomSlot = getRandomSlotName();
        name = randomSlot.name;
        newType = randomSlot.type;
        newLevel = 4;
      }
      break;
      case 4: {
        price = 1600;
        name = "City";
        newType = "city";
        newLevel = 5;
      }
      break;
      default: {}
      break;
      }

      if (
        price == null ||
        name == null ||
        newType == null ||
        newLevel == null
      ) {
        return res.status(401).send("Something went wrong");
      }

      slotResult.updated_price = price;
      slotResult.name = name;
      slotResult.current_type = newType;
      slotResult.level = newLevel;

      console.log("updated slot", slotResult);

      slotResult.owner = userResult;

      userResult.credits = userResult.credits - slotResult.updated_price;
      await userResult.save();
      await slotResult.save();
      await transactionController.saveTransaction(
        userResult,
        slotResult,
        "upgrade",
        price
      );

      await session.commitTransaction();
      return res.status(200).send(userResult);
    }
  } catch (error) {
    console.error("upgradeSlot error", error);
    await session.abortTransaction();
    return res.status(402).send("Something went wrong 402");
  } finally {
    console.log("finally is being called 3");
    session.endSession();
  }
};

/**
 * Buy a land when no one owns it
 * @param {Object} req slotIndex : String and userId : String
 * @param {Object} res
 * @returns {Object || String} returns either uer object or String message with status
 */
exports.buyLand = async function (req, res) {
  console.log("buyLand user current slot", req.body.slotIndex);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    var slotIndex = req.body.slotIndex;
    var userId = req.body.userId;
    var slotResult = await Slot.findOne({
      index: slotIndex,
    }).session(session);
    console.log("buyLand slot", slotResult);

    if (slotResult.owner != null) {
      return res.status(400).send("This place is already bought");
    } else {
      var userResult = await User.findOne({
        id: userId,
      }).session(session);
      console.log("buyLand landPrice", slotResult.landPrice);
      slotResult.owner = userResult;
      slotResult.name = "Land";
      userResult.credits = userResult.credits - slotResult.land_price;
      await userResult.save();
      await slotResult.save();
      await transactionController.saveTransaction(
        userResult,
        slotResult,
        "land",
        slotResult.landPrice
      );
      await session.commitTransaction();
      return res.status(200).send(userResult);
    }
  } catch (error) {
    console.error("buyLand error", error);
    await session.abortTransaction();
    return res.status(402).send("Something went wrong 402");
  } finally {
    console.log("finally is being called 3");
    session.endSession();
  }
};

/**
 * Buy a property from an owner
 * @param {Object} req slotIndex : String and userId : String
 * @param {Object} res
 * @returns {Object || String} returns either uer object or String message with status
 */
exports.buyProperty = async function (req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    var slotIndex = req.body.slotIndex;
    var userId = req.body.userId;

    var slotResult = await Slot.findOne({
        index: slotIndex,
      })
      .populate("owner", "id")
      .session(session);
    console.log("urgentSell slot", slotResult);
    var userResult = await User.findOne({
      id: userId,
    }).session(session);

    if (slotResult.owner == null) {
      return res.status(400).send("You cannot buy this: No owner found");
    } else if (slotResult.owner._id.toString() == userResult._id.toString()) {
      return res.send(401).send("You cannot buy this property from yourself");
    } else {
      var sellingPrice = getSlotSellingPrice(slotResult.level);
      if (sellingPrice == 0) {
        return res.send(402).send("Error occur 402");
      }
      var ownerResult = await User.findById(slotResult.owner._id).session(
        session
      );
      console.log("buyProperty landPrice", sellingPrice);
      ownerResult.credits = ownerResult.credits + sellingPrice;
      slotResult.owner = userResult;
      userResult.credits = userResult.credits - sellingPrice;
      slotResult.all_step_count = {};
      await ownerResult.save();
      await userResult.save();
      await slotResult.save();
      await transactionController.saveTransaction(
        userResult,
        slotResult,
        "seller",
        sellingPrice,
        ownerResult
      );

      await session.commitTransaction();
      return res.status(200).send(userResult);
    }
  } catch (error) {
    console.error("buyProperty error", error);
    await session.abortTransaction();
    return res.status(402).send("Something went wrong 402");
  } finally {
    session.endSession();
  }
};

/**
 * Buy a property at half price set by the owner
 * @param {Object} req slotIndex : String and userId : String
 * @param {Object} res
 * @returns {Object || String} returns either uer object or String message with status
 */
exports.buyPropertyHalf = async function (req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    var slotIndex = req.body.slotIndex;
    var userId = req.body.userId;

    var slotResult = await Slot.findOne({
        index: slotIndex,
      })
      .populate("owner", "id")
      .session(session);
    console.log("urgentSell slot", slotResult);
    var userResult = await User.findOne({
      id: userId,
    }).session(session);

    if (slotResult.owner == null) {
      return res.status(400).send("You cannot buy this: No owner found");
    } else if (slotResult.owner._id.toString() == userResult._id.toString()) {
      return res.send(401).send("You cannot buy this property from yourself");
    } else {
      var sellingPrice = Math.ceil(getSlotSellingPrice(slotResult.level) / 2);
      if (sellingPrice == 0) {
        return res.send(402).send("Error occur 402");
      }
      var ownerResult = await User.findById(slotResult.owner._id).session(
        session
      );
      console.log("buyPropertyHlf selling Price", sellingPrice);
      ownerResult.credits = ownerResult.credits + sellingPrice;
      slotResult.owner = userResult;
      userResult.credits = userResult.credits - sellingPrice;
      slotResult.all_step_count = {};
      slotResult.status = "";
      await ownerResult.save();
      await userResult.save();
      await slotResult.save();
      await transactionController.saveTransaction(
        userResult,
        slotResult,
        "half",
        sellingPrice,
        ownerResult
      );
      await session.commitTransaction();
      return res.status(200).send(userResult);
    }
  } catch (error) {
    console.error("buyProperty error", error);
    await session.abortTransaction();
    return res.status(402).send("Something went wrong 402");
  } finally {
    session.endSession();
  }
};

/**
 * Set the slot for urgent sell by the owner
 * @param {Object} req slotIndex : String and userId : String
 * @param {Object} res
 * @returns {String}  message with status
 */
exports.urgentSell = async function (req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    var slotIndex = req.body.slotIndex;
    var userId = req.body.userId;
    var slotResult = await Slot.findOne({
        index: slotIndex,
      })
      .populate("owner", "id")
      .session(session);
    console.log("urgentSell slot", slotResult);
    var userResult = await User.findOne({
      id: userId,
    }).session(session);
    console.log("slot id", slotResult.owner._id.toString());

    if (slotResult.owner._id.toString() != userResult._id.toString()) {
      console.log("reached condition");
      return res
        .status(400)
        .send("This place is already bought by someone else");
    } else {
      slotResult.status = "for_sell";
      await slotResult.save();
      await session.commitTransaction();
      return res.status(200).send("Place is set for urgent sell now");
    }
  } catch (error) {
    console.error("UrgentSell error", error);
    await session.abortTransaction();
    return res.status(402).send("Something went wrong 402");
  } finally {
    session.endSession();
  }
};

exports.getChance = async function (userResult) {
  try {
    var chance = getRandomInt(1, 6);
    var response = "";
  
     switch(chance) {
       case 1: {
         response = await loseTenPercent(userResult)
         break;
       }
       case 2: {
         response = await stealCreditsRandomly(userResult)
        break;
      }
      case 3: {
         response = await getShield(userResult)
        break;
      }
      case 4: {
        response = await get2xBonus(userResult)
        break;
      }
      case 5: {
        response = await forceSell(userResult)
        break;
      }
      case 6: {
        response = gotoChallenge()
        break;
      }
    }
    var user = await User.findOne({
      _id: userResult._id
    });
    return {
      ur: user,
      response: response,
    };
  } catch (error) {
    console.log("getChance error", error);
    throw error;
  }
};

/**
 * Getting random name for the slot at level 4
 */
var slot_names = [{
    name: "Business Center",
    type: "business_center",
  },
  {
    name: "Theme Park",
    type: "theme_park",
  },
];

function getRandomSlotName() {
  let i = Math.random() >= 0.5 ? 1 : 0;
  return slot_names[i];
}

/**
 * Function to get random chance
 * returns an integer between the range
 * @param {int} min
 * @param {int} max
 * @returns {int}
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Chance functions

async function loseTenPercent(userResult) {
  try {
    let tenPercentCredits = getTenPercent(userResult.credits);
    var result = await User.findByIdAndUpdate({
      _id: userResult._id
    }, {
      $inc: {
        credits: -tenPercentCredits,
      },
    });
    return {
      effect: "scam",
      message: `You have lost ${tenPercentCredits} credits`,
    };
  } catch (error) {
    console.error("slotController loseTenPercent error", error);
    throw error;
  }
}

async function stealCreditsRandomly(userResult) {
  try {
    var userResultLean = await User.aggregate([{
        $match: {
          $and: [{
            _id: {
              $ne: userResult._id
            }
          }, {
            "shield.active": false
          }],
        },
      },
      {
        $sample: {
          size: 1
        }
      },
    ]);
    console.log("stealCredits result", userResultLean);
    if (userResultLean != null) {
      let tenPercentCredits = getTenPercent(userResultLean[0].credits);

      var result1 = await User.findByIdAndUpdate(userResult._id, {
        $inc: {
          credits: tenPercentCredits,
        },
      });
      var result2 = await User.findByIdAndUpdate(userResultLean[0]._id, {
        $inc: {
          credits: -tenPercentCredits,
        },
      });

      return {
        effect: "steal",
        message: `You steal ${tenPercentCredits} credits from user ${userResultLean[0].id}`,
      };
    } else {
      return {
        effect: "steal",
        message: `Nothing to steal`,
      };
    }
  } catch (error) {
    console.error("slotController stealCreditsRandomly error", error);
    throw error;
  }
}

function getTenPercent(credits) {
  return Math.ceil((credits * 10) / 100);
}

//TODO: Also make cannot be kicked
async function getShield(userResult) {
  try {
    var result = await User.findByIdAndUpdate({
      _id: userResult._id
    }, {
      $set: {
        "shield.active": true,
        "shield.date": new Date()
      }
    });
    return {
      effect: "shield",
      message: `Shield is activated`,
    };
  } catch (error) {
    console.log("getShield error", error);
    throw error;
  }
}

async function get2xBonus(userResult) {
  try {
    var result = await User.findByIdAndUpdate({
      _id: userResult._id
    }, {
      $set: {
        "bonus.active": true,
        "bonus.moves": 2
      }
    });
    return {
      effect: "bonus",
      message: `You are getting 2x bonus for next 2 dice rolls`,
    };
  } catch (error) {
    console.log("get2xBonus error", error);
    throw error;
  }
}

async function forceSell(userResult) {
  try {
    var slotResult = await Slot.findOne({
      $and: [{
        owner: userResult
      }, {
        status: {
          $ne: "for_sell"
        }
      }],
    });
    if (slotResult != null) {
      slotResult.status = "for_sell";
      await slotResult.save();
      return {
        effect: "force_sell",
        message: `Your ${slotResult.name} at number ${slotResult.index} is set for sale now`,
      };
    } else {
      return {
        effect: "force_sell",
        message: `You do not have any property to set for sell`,
      };
    }
  } catch (error) {
    console.error("forceSell error", error);
    throw error;
  }
}

function gotoChallenge() {
  return {
    effect: "challenge",
    message: `go to challenge`,
  };
}
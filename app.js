const express = require("express");
const app = express();
const http = require("http");
var server = http.createServer(app);
const socketIO = require("socket.io")(server);
var mongoose = require("mongoose");
const conn = require("./database/conn");

const User = require("./models/user");
const Slot = require("./models/slot");
const BuyingRequest = require("./models/buying_request")

//* socket emitting
//  userSocket.emit('checkUsers', users)  //* emits to the one connected socket
//  socketIO.sockets.emit('checkUsers', users) //* emit to the all connected sockets

const slotController = require("./controllers/slotController")

const userStream = User.watch();
const slotStream = Slot.watch();

app.use(express.json());

userStream.on("change", (change) => {
  console.log("a change has been detected in the user collection", change);
  sendAllUsersData();
});

slotStream.on("change", (change) => {
  console.log("change in slot", change);
  console.log(change.operationType);
  updateSlotsFAUsers();
});

async function updateSlotsFAUsers() {
  try {
    var slotResult = await Slot.find().populate("owner", "id");
    console.log("updateSlotsFAUsers", slotResult);
    socketIO.sockets.emit("checkBoard", slotResult);
  } catch (error) {
    console.error("error updating slot", error);
  }
}

async function sendAllUsersData() {
  try {
    var data = await User.find();
    console.log("users collection data", data);
    socketIO.sockets.emit("checkUsers", data);
  } catch (error) {
    console.error("error updating all users", error);
  }
}


async function startServer() {
  await conn.main();
  server.listen(process.env.PORT || 3000, () => {
    console.log("listening on the function");
  });
}

startServer();

socketIO.on("connection", (userSocket) => {
  console.log("user socket id", userSocket.id);
  userSocket.on("online", async (userId) => {
    try {
      var result = await User.findOne({
        id: userId,
      }).exec();
      result.presence = "online";
      result.socket_id = userSocket.id;
      await result.save();

      console.log("result after change", result);

      //  userSocket.emit('checkUsers', users)
      // socketIO.sockets.emit('checkUsers', users)
    } catch (error) {
      console.error("online error", error);
    }
  });
  console.log(" socket connection has been established");

  userSocket.on("userMove", async (data) => {
    console.log("user moved", data);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      var userResult = await User.findOne({
        id: data.id,
      }).session(session);
      var slotResult = await Slot.findOne({
        index: data.current_slot,
      }).populate('owner').session(session);

      console.log("slot data", slotResult);

      //* check if the initial type is land to make the rent or buying function
      if (slotResult.initial_type == "land") {
        if (slotResult.owner != null && slotResult.owner._id.toString() != userResult._id.toString()) {
          console.log("land is already bought by someone else", userResult._id.toString())
          console.log('id of the owner', slotResult.owner._id.toString())
          console.log('owner of the land', slotResult.owner)
          var rent = Math.ceil(slotResult.updated_price * 10 / 100)
          console.log('The rent is: ', rent)
          userResult.credits = userResult.credits - rent
          var userResult2 = await User.findByIdAndUpdate({_id: slotResult.owner._id}, {$inc: {'credits': rent}}).session(session)
         
          console.log('if user steps exists')
          // console.log(slotResult.all_step_count)
          // console.log(userResult._id.toString() in slotResult.all_step_count)

          //TODO: Remove this first condition later and add {} in the slot schema for counts
          if(slotResult.all_step_count == null) {
            console.log('step count is null')
            slotResult.all_step_count = {}
            slotResult.all_step_count[userResult._id.toString()] = 1
            console.log('new step count added with property')
          }
          else if (userResult._id.toString() in slotResult.all_step_count == false) {
            console.log('step count does not contains users')
            slotResult.all_step_count[userResult._id.toString()] = 1
            console.log('new step count added with user')
          }
          else {
            console.log('step count not empty', slotResult.all_step_count[userResult._id.toString()] )
            slotResult.all_step_count[userResult._id.toString()] = slotResult.all_step_count[userResult._id.toString()] + 1
            console.log('step count is incremented', slotResult.all_step_count[userResult._id.toString()])
          }

        //  slotResult.markModified("all_step_count")
          console.log('result of slot')
          console.log(slotResult)

          //TODO: Add User selling condition before count step to buy on half price
         

          //TODO: Add the condition for counting steps
          var stepCount = slotResult.all_step_count[userResult._id.toString()]
          if(slotResult.status != null && slotResult.status == 'for_sell') {
            console.log('buy half')
            var sellUrgentData = { 
              slot: slotResult,
              owner: userResult2,
            }
            userSocket.emit('buy_owned_slot_half', sellUrgentData)
          }
          else if(stepCount % 3 == 0) {
            console.log('buy fresh')
            var sellData = { 
            slot: slotResult,
            owner: userResult2,
          }
          userSocket.emit('buy_owned_slot', sellData)
          }
          else {
            // do nothing
          }
         
          
        } else if( slotResult.owner != null && slotResult.owner._id.toString() == userResult._id.toString()) {

          console.log('owner is the current user')
           if(slotResult.current_type != 'city') {
           userSocket.emit('upgrade_slot', slotResult) 
           }
           else {
             console.log('type is city which cannot be upgraded')
           }
        }
        else {
          //* buy the land
          console.log("owner is null");
          userSocket.emit("buy_land", "buy");
          // userResult.credits = userResult.credits - 50
          // slotResult.owner = userResult._id
        }
      } else {
        //* other effects of the slot
        console.log("not a land");
      }
      console.log('user loops',data.loops)
      userResult.loops = data.loops;
      userResult.current_slot = data.current_slot;
      //* it is necessary to tell what field is being changed
      slotResult.markModified("all_step_count")
      await userResult.save();
      await slotResult.save();
      await session.commitTransaction();
      userSocket.emit('update_current_user', userResult)      
    } catch (error) {
      console.error("User move error", error);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  });

  userSocket.on("disconnect", async () => {
    try {
      console.log("user has disconnected");
      var result = await User.findOne({
        socket_id: userSocket.id,
      }).exec();
      result.presence = "offline";
      await result.save();
      //userSocket.emit('checkUsers', users)
      // socketIO.sockets.emit('checkUsers', users)
    } catch (error) {
      console.log("disconnect error", error);
    }
  });
});

app.get("/", (req, res) => {
  res.send("Node server is running ");
});

app.post("/login", async (req, res) => {
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
});

app.get("/getSlots", async (req, res) => {
  try {
    var result = await Slot.find().populate("owner", "id");
    console.log("slots from db", result);
    return res.status(200).send(result);
  } catch (error) {
    console.error("getSlot error", error);
    return res.status(400).send("something went wrong");
  }
});

app.post("/buyLand", async (req, res) => {
  console.log('buyLand user current slot', req.body.slotIndex)
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
      console.log('buyLand landPrice', slotResult.landPrice)
      slotResult.owner = userResult;
      userResult.credits = userResult.credits - slotResult.land_price;
      await userResult.save();
      await slotResult.save();
      await session.commitTransaction();
      return res.status(200).send(userResult);
    }
  } catch (error) {
    console.error("buyLand error", error);
    await session.abortTransaction()
    return res.status(402).send("Something went wrong 402");
  } finally {
    console.log("finally is being called 3");
    session.endSession();
  }
});

app.post("/upgradeSlot", async (req, res) => {
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
        case 0:
          {
            price = 100;
            name = 'House';
            newType = 'house'
            newLevel = 1
          }
          break;
        case 1:
          {
            price = 200;
            name = 'Shop';
            newType = 'shop'
            newLevel = 2
          }
          break;
        case 2:
          {
            price = 400;
            name = 'Condo';
            newType = 'condo'
            newLevel = 3
          }
          break;
        case 3:
          {
            price = 800;
            let randomSlot = getRandomSlotName()
            name = randomSlot.name;
            newType = randomSlot.type;
            newLevel = 4
          }
          break;
        case 4:
          {
            price = 1600;
            name = 'City';
            newType = 'city'
            newLevel = 5
          }
          break;
        default:
          {}
          break;
      } 

      if(price == null || name == null || newType == null || newLevel == null) {
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
});

//* buy property is buying the property from an owner
app.post("/buyProperty", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    var slotIndex = req.body.slotIndex;
    var userId = req.body.userId;

    var slotResult = await Slot.findOne({
      index: slotIndex,
    }).populate("owner", "id").session(session);
    console.log("urgentSell slot", slotResult)
    var userResult = await User.findOne({
      id: userId,
    }).session(session);

    if (slotResult.owner == null) {
      return res.status(400).send("You cannot buy this: No owner found");
    }
    else if(slotResult.owner._id.toString() == userResult._id.toString()) {
      return res.send(401).send("You cannot buy this property from yourself")
    }
     else {
    
      var sellingPrice = slotController.getSlotSellingPrice(slotResult.level)
      if(sellingPrice == 0) {
        return res.send(402).send('Error occur 402')
      }
      var ownerResult = await User.findById(slotResult.owner._id).session(session);
      console.log('buyProperty landPrice', sellingPrice)
      ownerResult.credits = ownerResult.credits + sellingPrice;
      slotResult.owner = userResult;
      userResult.credits = userResult.credits - sellingPrice;
      slotResult.all_step_count = {}
      await ownerResult.save();
      await userResult.save();
      await slotResult.save();
      await session.commitTransaction();
      return res.status(200).send(userResult);
    }

  } catch(error) {
    console.error("buyProperty error", error);
    await session.abortTransaction()
    return res.status(402).send("Something went wrong 402");
  } finally {
    session.endSession()
  }
})

app.post("/buyPropertyHalf", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    var slotIndex = req.body.slotIndex;
    var userId = req.body.userId;

    var slotResult = await Slot.findOne({
      index: slotIndex,
    }).populate("owner", "id").session(session);
    console.log("urgentSell slot", slotResult)
    var userResult = await User.findOne({
      id: userId,
    }).session(session);

    if (slotResult.owner == null) {
      return res.status(400).send("You cannot buy this: No owner found");
    }
    else if(slotResult.owner._id.toString() == userResult._id.toString()) {
      return res.send(401).send("You cannot buy this property from yourself")
    }
     else {
    
      var sellingPrice = Math.ceil(slotController.getSlotSellingPrice(slotResult.level) / 2)
      if(sellingPrice == 0) {
        return res.send(402).send('Error occur 402')
      }
      var ownerResult = await User.findById(slotResult.owner._id).session(session);
      console.log('buyPropertyHlf selling Price', sellingPrice)
      ownerResult.credits = ownerResult.credits + sellingPrice;
      slotResult.owner = userResult;
      userResult.credits = userResult.credits - sellingPrice;
      slotResult.all_step_count = {}
      slotResult.status = "";
      await ownerResult.save();
      await userResult.save();
      await slotResult.save();
      await session.commitTransaction();
      return res.status(200).send(userResult);
    }

  } catch(error) {
    console.error("buyProperty error", error);
    await session.abortTransaction()
    return res.status(402).send("Something went wrong 402");
  } finally {
    session.endSession()
  }
})

app.post("/urgentSell", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
try {
  var slotIndex = req.body.slotIndex;
  var userId = req.body.userId; 
  var slotResult = await Slot.findOne({
    index: slotIndex,
  }).populate("owner", "id").session(session);
  console.log("urgentSell slot", slotResult)
  var userResult = await User.findOne({
    id: userId,
  }).session(session);
  console.log("slot id", slotResult.owner._id.toString());

  if (slotResult.owner._id.toString() != userResult._id.toString()) {
    console.log('reached condition')
    return res.status(400).send("This place is already bought by someone else");
  } 
  else {
     slotResult.status = "for_sell"
     await slotResult.save()
     await session.commitTransaction()
     return res.status(200).send("Place is set for urgent sell now")
  }
} catch(error) {
  console.error("UrgentSell error", error);
  await session.abortTransaction()
  return res.status(402).send("Something went wrong 402");
} finally {
  session.endSession()
}
})

//TODO: the version of socket is 2.4 which is compatible with flutter version, update accrodingly in futrue


//TODO: put this into another helper file


var slot_names = [
  {
    name: 'Business Center',
    type: 'business_center'
  },
  {
    name: 'Theme Park',
    type: 'theme_park'
  }
]

function getRandomSlotName() {
  let i = (Math.random() >= 0.5) ? 1 :0
  return slot_names[i]
}
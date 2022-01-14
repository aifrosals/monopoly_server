const express = require("express");
const app = express();
const http = require("http");
var server = http.createServer(app);
const socketIO = require("socket.io")(server);
var mongoose = require("mongoose");

/**
 * for parsing the request body
 */
app.use(express.json());

/**
  * conn is the connection for the mongodb with mongoose 
  */
const conn = require("./database/conn");

/**
 * mongoose models to work with
 */
const User = require("./models/user");
const Slot = require("./models/slot").Slot;


//* socket emitting
//  userSocket.emit('checkUsers', users)  //* emits to the one connected socket
//  socketIO.sockets.emit('checkUsers', users) //* emit to the all connected sockets

/** 
 * controller controlling the actions related to their models
 */
const slotController = require("./controllers/slotController")
const transactionController = require("./controllers/transactionController")


/**
 * starting point of the server
 * This also creates the connection with mongodb by calling
 * conn.main()
 */
async function startServer() {
  await conn.main();
  server.listen(process.env.PORT || 3000, () => {
    console.log("listening on the function");
  });
}

startServer();

/**
 * watch function is used for the mongoose schema (model) to create streams for change detection
 */
const userStream = User.watch();
const slotStream = Slot.watch();


/**
 * change function of the stream for User schema (model)
 * detects the change in the Users collection.
 * Inside this, a sendAllUsers is called to send data of users
 * to all other users.
 */
userStream.on("change", (change) => {
  console.log("a change has been detected in the user collection", change);
  sendAllUsersData();
});

/**
 * same change function for slot schema (model). Detects the change in
 * slots collection and notify about the current data of slots to the all
 * users 
 */
slotStream.on("change", (change) => {
  console.log("change in slot", change);
  console.log(change.operationType);
  updateSlotsFAUsers();
});

/**
 * update the current slot data which is also board data
 * to all the users connected with the socket.
 */
async function updateSlotsFAUsers() {
  try {
    var slotResult = await Slot.find().populate("owner", "id").sort('index');
    console.log("updateSlotsFAUsers", slotResult);
    socketIO.sockets.emit("checkBoard", slotResult);
  } catch (error) {
    console.error("error updating slot", error);
  }
}

/**
 * send all the users data which is necessary for showing offline users.
 */
async function sendAllUsersData() {
  try {
    var data = await User.find();
    console.log("users collection data", data);
    socketIO.sockets.emit("checkUsers", data);
  } catch (error) {
    console.error("error updating all users", error);
  }
}




/**
 * Connecting a socket from the client/mobile sid to the server
 * calls other functions with socket (userSocket) to communicate with
 * the client/mobile side in real time and making duplex connections.
 */
socketIO.on("connection", (userSocket) => {

  console.log("user socket id", userSocket.id);

  /**
   * When emitted from the client/mobile side, sets the users presence to online 
   * in the users collection. 
   */
  userSocket.on("online", async (userId) => {
    try {
      var result = await User.findOne({
        id: userId,
      }).exec();
      result.presence = "online";
      result.socket_id = userSocket.id;
      await result.save();

      console.log("result after change", result);

    } catch (error) {
      console.error("online error", error);
    }
  });

  console.log(" socket connection has been established");

  /**
   * Most important function of the server and board game.
   * It is emitted from the client/mobile side when a user roll dice and moves
   * to the slot.
   * Receive data from the client/mobile side which contains user id and the 
   * slot index to which user moved. The data of the user and the slot is
   * fetched from the database.
   * Depending upon the slot initial and current type and
   * various factors triggers respective functionality.
   */
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
         /**
          * Checks if the land/property is owned by the current user or someone else
          * if owned by someone else then 
          * Pay rent (deducts current user credits buy 10% of slot price and increments the
          * owner credits).
          * Add step count to this slot, when step count reaches 3 or multiple of 3,
          * the user receives the option to buy land from the owner of the slot. 
          */
        if (slotResult.owner != null && slotResult.owner._id.toString() != userResult._id.toString()) {
          console.log("land is already bought by someone else", userResult._id.toString())
          console.log('id of the owner', slotResult.owner._id.toString())
          console.log('owner of the land', slotResult.owner)
          var rent = Math.ceil(slotResult.updated_price * 10 / 100)
          console.log('The rent is: ', rent)
          userResult.credits = userResult.credits - rent
          var userResult2 = await User.findByIdAndUpdate({
            _id: slotResult.owner._id
          }, {
            $inc: {
              'credits': rent
            }
          }).session(session)

          /**
           * When rent is paid a transaction is saved with type rent
           */
          await transactionController.saveTransaction(userResult, slotResult, 'rent', rent)

          //TODO: Remove this first condition later and add {} in the slot schema for counts
          /**
           * Since this a place owned by someone else. It will contain the steps of other users.
           * Increment the step count of a user on object key/property (their id)
           * When a user steps 3 times they has they will receive a prompt to buy the place.
           */
          if (slotResult.all_step_count == null) {
            console.log('step count is null')
            slotResult.all_step_count = {}
            slotResult.all_step_count[userResult._id.toString()] = 1
            console.log('new step count added with property')
            /**
             * check if all_step_count object contains current user's id as a key if ot then
             * create one with value 1 else increment 1 
             */
          } else if (userResult._id.toString() in slotResult.all_step_count == false) {
            console.log('step count does not contains users')
            slotResult.all_step_count[userResult._id.toString()] = 1
            console.log('new step count added with user')
          } else {
            console.log('step count not empty', slotResult.all_step_count[userResult._id.toString()])
            slotResult.all_step_count[userResult._id.toString()] = slotResult.all_step_count[userResult._id.toString()] + 1
            console.log('step count is incremented', slotResult.all_step_count[userResult._id.toString()])
          }
          console.log('result of slot')
          console.log(slotResult)

          //TODO: Add the condition for counting steps for every slot (can be heavy)
          /**
           * Check if the slot already has for urgent sell status "for_sell"
           * if so emit to buy slot at half price
           * else check user steps for 3 times and emit normal buy property at
           * full selling price  
           */
          var stepCount = slotResult.all_step_count[userResult._id.toString()]
          if (slotResult.status != null && slotResult.status == 'for_sell') {
            console.log('buy half')
            var sellUrgentData = {
              slot: slotResult,
              owner: userResult2,
            }
            userSocket.emit('buy_owned_slot_half', sellUrgentData)
          } else if (stepCount % 3 == 0) {
            console.log('buy fresh')
            var sellData = {
              slot: slotResult,
              owner: userResult2,
            }
            userSocket.emit('buy_owned_slot', sellData)
          } else {
            // do nothing
          }
        } 

        /**
         * Checks if the owner is current user then emit for upgrading property or sell urgent
         * if the slot level is 5 or city do nothing
         */
        else if (slotResult.owner != null && slotResult.owner._id.toString() == userResult._id.toString()) {
          console.log('owner is the current user')
          //TODO: Instead of using city use level for this condition
          if (slotResult.current_type != 'city') {
            userSocket.emit('upgrade_slot', slotResult)
          } else {
            console.log('type is city which cannot be upgraded')
          }
        } 
        
        /**
         * Owner is null, emit buy land
         */
        else {
          //* buy the land
          console.log("owner is null");
          userSocket.emit("buy_land", "buy");
          // userResult.credits = userResult.credits - 50
          // slotResult.owner = userResult._id
        }

        /**
         * Not a land/property trigger the effect of the slot.
         */
      } else {
        //* other effects of the slot
        console.log("not a land");

        /**
         * If the slot is reward add the current user to step count
         * When step count reaches to number 5: increment 50 credits and set current user's step count to 0
         */
        if (slotResult.initial_type == "reward") {
          console.log('reward')
          if (slotResult.all_step_count == null) {
            slotResult.all_step_count = {}
            slotResult.all_step_count[userResult._id.toString()] = 1
          } else if (userResult._id.toString() in slotResult.all_step_count == false) {
            slotResult.all_step_count[userResult._id.toString()] = 1
          } else {
            slotResult.all_step_count[userResult._id.toString()] = slotResult.all_step_count[userResult._id.toString()] + 1
          }
          if (slotResult.all_step_count[userResult._id.toString()] == 5) {
            userResult.credits = userResult.credits + 50
            slotResult.all_step_count[userResult._id.toString()] = 0
          }
        } 
        
        /**
         * If slot is chest then getCommunityChestCredits and add them to current user's credits.
         */
        else if (slotResult.initial_type == "chest") {
          let cred = slotController.getCommunityChestCredits()
          userResult.credits = userResult.credits + cred
          userSocket.emit('chest', `Congratulations you gain ${cred} credits from Community Chest`)
        }
      }

      console.log('user loops', data.loops)
      userResult.loops = data.loops;
      userResult.current_slot = data.current_slot;

      //* Mark all_step_count Modified so the object is updated in the database
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

  /**
   * On socket disconnect find the user having this socket and
   * set presence to offline
   */
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
    var result = await Slot.find().populate("owner", "id").sort('index');
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
      slotResult.name = "Land"
      userResult.credits = userResult.credits - slotResult.land_price;
      await userResult.save();
      await slotResult.save();
      await transactionController.saveTransaction(userResult, slotResult, 'land', slotResult.landPrice)
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
    } else if (slotResult.owner._id.toString() == userResult._id.toString()) {
      return res.send(401).send("You cannot buy this property from yourself")
    } else {

      var sellingPrice = slotController.getSlotSellingPrice(slotResult.level)
      if (sellingPrice == 0) {
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
      await transactionController.saveTransaction(userResult, slotResult, 'seller', sellingPrice)

      await session.commitTransaction();
      return res.status(200).send(userResult);
    }

  } catch (error) {
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
    } else if (slotResult.owner._id.toString() == userResult._id.toString()) {
      return res.send(401).send("You cannot buy this property from yourself")
    } else {

      var sellingPrice = Math.ceil(slotController.getSlotSellingPrice(slotResult.level) / 2)
      if (sellingPrice == 0) {
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
      await transactionController.saveTransaction(userResult, slotResult, 'half', sellingPrice)
      await session.commitTransaction();
      return res.status(200).send(userResult);
    }

  } catch (error) {
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
    } else {
      slotResult.status = "for_sell"
      await slotResult.save()
      await session.commitTransaction()
      return res.status(200).send("Place is set for urgent sell now")
    }
  } catch (error) {
    console.error("UrgentSell error", error);
    await session.abortTransaction()
    return res.status(402).send("Something went wrong 402");
  } finally {
    session.endSession()
  }
})


// Transaction
app.post('/getTransactions', transactionController.getTransactions)

//TODO: the version of socket is 2.4 which is compatible with flutter version, update accrodingly in futrue


//TODO: put this into another helper file


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
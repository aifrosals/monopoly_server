const express = require("express");
const app = express();
const http = require("http");
const cors = require('cors')
var server = http.createServer(app);
const socketIO = require("socket.io")(server);
var mongoose = require("mongoose");

/**
 * for parsing the request body
 */
app.use(express.json());

app.use(cors())

/**
 * conn is the connection for the mongodb with mongoose 
 */
const conn = require("./database/conn");

//TODO: work on schedule module
/** 
 * Scheduling Controller
 */
const schedule = require('./controllers/scheduleController')

/**
 * mongoose models to work with
 */
const User = require("./models/user");
const Slot = require("./models/slot").Slot;


//* socket emitting
//  userSocket.emit('checkUsers', users)  //* emits to the one connected socket
//  socketIO.sockets.emit('checkUsers', users) //* emit to the all connected sockets

/**
 * Auth middleware
 */
const auth = require('./middleware/auth')

/**
 * Admin controller
 */
const adminController = require('./admin/adminController')

/** 
 * controller controlling the actions related to their models
 */
const userController = require('./controllers/userController')
const slotController = require('./controllers/slotController')
const transactionController = require('./controllers/transactionController')
const challengeController = require('./controllers/challengeController')


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

//* creating an admin
//adminController.createAdmin()

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
  userSocket.on("userMove", async (userData) => {
    console.log("user moved", userData);
    var data = userData.user
    const session = await mongoose.startSession();
    session.startTransaction();
    //* to make the 2x work for next 2 dice roll
    var chance2x = false

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
          if (userResult.credits < rent && !(userResult.credits <= 0)) {
            rent = Math.ceil(userResult.credits * 30 / 100)
          }
          console.log('The rent is: ', rent)
          userResult.credits = userResult.credits - rent
          var userResult2 = await User.findByIdAndUpdate({
            _id: slotResult.owner._id
          }, {
            $inc: {
              'credits': rent
            }
          }).session(session)
          userSocket.emit('show_rent_message', rent)

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
            slotResult.all_step_count = {}
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
            // userSocket.emit('reward_star', 'reward_star')
          } else if (userResult._id.toString() in slotResult.all_step_count == false) {
            slotResult.all_step_count[userResult._id.toString()] = 1
            //  userSocket.emit('reward_star', 'reward_star')

          } else {
            slotResult.all_step_count[userResult._id.toString()] = slotResult.all_step_count[userResult._id.toString()] + 1
            //  userSocket.emit('reward_star', 'reward_star')

          }
          if (slotResult.all_step_count[userResult._id.toString()] == 5) {
            let reward = 50
            userResult.credits = userResult.credits + reward
            slotResult.all_step_count[userResult._id.toString()] = 0
            await transactionController.saveTransaction(userResult, slotResult, 'reward', reward)
            userSocket.emit('reward', 'Congratulations you gain 50 credits')
          } else {
            userSocket.emit('reward_star', 'reward_star');
          }
        }

        /**
         * If slot is chest then getCommunityChestCredits and add them to current user's credits.
         */
        else if (slotResult.initial_type == "chest") {
          let cred = slotController.getCommunityChestCredits()
          userResult.credits = userResult.credits + cred
          await transactionController.saveTransaction(userResult, slotResult, 'chest', cred)
          userSocket.emit('chest', `Congratulations you gain ${cred} credits from Community Chest`)

          /**
           * If it is chance then get chance results
           */
        } 
        else if (slotResult.initial_type == "chance") {
          let response = await slotController.getChance(userResult)
          console.log('chance result', response)
          userResult = response.ur
          if (response.response.effect == 'bonus') {
            chance2x = true
          }
          userSocket.emit('chance', response)
        }
        else if (slotResult.initial_type == "challenge") {
          userSocket.emit('challenge', 'challenge')
        
        }
        else if(slotResult.initial_type == "end") {
          userResult = userController.getBundleReward(userResult)
          userSocket.emit('end', 'end')
        }
    

      }

      console.log('user loops', data.loops)
      userResult.loops = data.loops;
      userResult.current_slot = data.current_slot;

      //* Mark all_step_count Modified so the object is updated in the database
      slotResult.markModified("all_step_count")

      var bonusFactor = 1

      if (userResult.bonus != null && userResult.bonus.active == true && userResult.bonus.moves > 0 && chance2x == false) {
        userResult.bonus.moves = userResult.bonus.moves - 1
        bonusFactor = 2
        if (userResult.bonus.moves == 0) {
          userResult.bonus.active = false
        }
      }

      if (userData.diceFace != null) {
        userResult.credits = userResult.credits + (userData.diceFace * bonusFactor)
      }

      await userResult.save();
      await slotResult.save();
      await session.commitTransaction();
      /**
       * Emit update current user for movement is complete successfully
       */
      userSocket.emit('update_current_user', userResult)
    } catch (error) {
      console.error("User move error", error);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  });

  /**
   * Test to move the user back one slot
   */
  userSocket.on('moveBack', async (userData) => {
    console.log('user data current', userData)
    const result = await userController.moveBack(userData)
    userSocket.emit('update_current_user', result)
  })

 

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

/**
 * Admin Api routes
 */
app.post('/adminLogin', adminController.adminLogin)
app.post('/addQuestion', auth, challengeController.addQuestion)
app.get('/getQuestions', auth, challengeController.getQuestions)
app.put('/updateQuestion', auth, challengeController.updateQuestion)
app.delete('/deleteQuestion', auth, challengeController.deleteQuestion)


/**
 * User Api routes
 */
app.post('/login', userController.login)
app.post('/kickUser', userController.kickUser)


/**
 * Slot API routes
 */
app.get('/getSlots', slotController.getSlots)
app.post('/buyLand', slotController.buyLand)
app.post('/buyProperty', slotController.buyProperty)
app.post('/buyPropertyHalf', slotController.buyPropertyHalf)
app.post('/upgradeSlot', slotController.upgradeSlot)
app.post('/urgentSell', slotController.urgentSell)


/**
 * User challenge routes
 */
app.post('/getChallengeQuestion', challengeController.getChallengeQuestion)
app.post('/submitAnswer', challengeController.submitAnswer)


// Transaction Api routes
app.post('/getTransactions', transactionController.getTransactions)

//TODO: the version of socket is 2.4 which is compatible with flutter version, update accordingly in future


//TODO: put this into another helper file
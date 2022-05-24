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

/**
 * socket function
 */
const SocketMove = require('./socket/socketMove')

//* socket emitting
//  userSocket.emit('checkUsers', users)  //* emits to the one connected socket
//  socketIO.sockets.emit('checkUsers', users) //* emit to the all connected sockets

/**
 * Auth middleware
 */
const auth = require('./middleware/auth')
const socketAuth = require('./middleware/socketAuth')

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
const feedbackController = require('./controllers/feedbackController')
const statsController = require('./controllers/statsController')


/**
 * starting point of the server
 * This also creates the connection with mongodb by calling
 * conn.main()
 */
async function startServer() {
  await conn.main()
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
const userStream = User.watch([], {fullDocument:'updateLookup'});
const slotStream = Slot.watch();

app.set('socketio', socketIO)

/**
 * change function of the stream for User schema (model)
 * detects the change in the Users collection.
 * Inside this, a sendAllUsers is called to send data of users
 * to all other users.
 */
userStream.on("change", (change) => {
  console.log("a change has been detected in the user collection", change);
  sendAllUsersData();
  sendOnlineUserData(change.fullDocument)
});

/**
 * same change function for slot schema (model). Detects the change in
 * slots collection and notify about the current data of slots to the all
 * users 
 */
slotStream.on("change", (change) => {
  console.log("change in slot", change);
  console.log(change.operationType);
  if(change.operationType === 'update') {
  updateSlotsFAUsers();
  }
});

/**
 * update the current slot data which is also board data
 * to all the users connected with the socket.
 */
async function updateSlotsFAUsers() {
  try {
    var slotResult = await Slot.find().populate("owner", "id").sort('index');
    console.log("updateSlotsFAUsers", slotResult);
    socketIO.sockets.emit("check_board", slotResult);
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
    socketIO.sockets.emit("check_users", data);
  } catch (error) {
    console.error("error updating all users", error);
  }
}

/**
 * Update online users
 */
 async function sendOnlineUserData(user) {
  try {
     console.log('full doc', user)
     socketIO.sockets.emit(user._id, user)
  } catch (error) {
    console.error("error updating all users", error);
  }
}


socketIO.use(socketAuth)

/**
 * Connecting a socket from the client/mobile sid to the server
 * calls other functions with socket (userSocket) to communicate with
 * the client/mobile side in real time and making duplex connections.
 */
socketIO.on("connection", SocketMove);


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
 * Stats Api routes
 */
app.get('/getUserCountStats', auth, statsController.getUserCountStats)
app.get('/getDailyActiveUsers', auth, statsController.getDailyActiveUsers)
app.get('/getRegisteredUsers', auth, statsController.getRegisteredUsers)
app.get('/getGuests', auth, statsController.getGuests)
app.get('/getUserCount', auth, statsController.getUserCount)
app.get('/getMonthlyActivity', auth, statsController.getMonthlyActivity)
app.get('/get3DayActivity', auth, statsController.get3DayActivity)
app.get('/getWeeklyActivity', auth, statsController.getWeeklyActivity)

/**
 * 
 * User Api routes
 */
app.post('/registerUserWithEmail', userController.registerUserWithEmail)
app.post('/login', userController.login)
app.post('/registerGuest', userController.registerGuest)
app.post('/registerGuestWithEmail', userController.registerGuestWithEmail)
app.post('/loginWithToken', userController.loginWithToken)
app.post('/loginWithEmail', userController.loginWithEmail)
app.post('/kickUser', userController.kickUser)
app.post('/useStep', userController.useStep)
app.post('/loseTreasureHunt', userController.loseTreasureHunt)
app.post('/getTreasureHuntReward', userController.getTreasureHuntReward)
app.get('/getAllUsers', userController.getAllUsers)
app.post('/activatePremium', userController.activatePremium)
app.post('/deactivatePremium', userController.deactivatePremium)
app.post('/addDice', userController.addDices)


/**
 * Slot API routes
 */
app.get('/getSlots', auth, slotController.getSlots)
app.post('/buyLand', slotController.buyLand)
app.post('/buyProperty', slotController.buyProperty)
app.post('/buyPropertyHalf', slotController.buyPropertyHalf)
app.post('/upgradeSlot', slotController.upgradeSlot)
app.post('/urgentSell', slotController.urgentSell)
app.post('/saveEditableSlots', auth, slotController.saveEditableSlots)


/**
 * User challenge routes
 */
app.post('/getChallengeQuestion', challengeController.getChallengeQuestion)
app.post('/submitAnswer', challengeController.submitAnswer)


/**
 * Transaction routes
 */
app.post('/getTransactions', transactionController.getTransactions)
app.post('/getPaginatedTransactions', transactionController.getPaginatedTransactions)

/**
 * Feedback routes
 */
app.post('/submitFeedback', feedbackController.submitFeedback)
app.get('/getFeedback', feedbackController.getFeedbacks)
app.post('/getPaginatedFeedback', feedbackController.getPaginatedFeedbacks)


//TODO: the version of socket is 2.4 which is compatible with flutter version, update accordingly in future



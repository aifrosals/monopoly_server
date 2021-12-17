const express = require("express");
const app = express();
const http = require("http");
var server = http.createServer(app);
const socketIO = require("socket.io")(server);
var mongoose = require("mongoose");
const conn = require("./database/conn");

const User = require("./models/user");
const Slot = require("./models/slot");

//* socket emitting
//  userSocket.emit('checkUsers', users)  //* emits to the one connected socket
//  socketIO.sockets.emit('checkUsers', users) //* emit to the all connected sockets

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

async function payRent()
{

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
      //TODO: add weighting mechanism for the dice to move smooth
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
        } else if( slotResult.owner != null && slotResult.owner._id.toString() == userResult._id.toString()) {

          console.log('owner is the current user')
          //TODO: add the upgrading logic here
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
      userResult.current_slot = data.current_slot;
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
    console.error("login error", error.stack());
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
    console.error("getSlot error", error.stack());
    return res.status(400).send("something went wrong");
  }
});

app.post("/buyLand", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    var slotIndex = req.body.slotIndex;
    var userId = req.body.userId;
    var slotResult = await Slot.findOne({
      index: slotIndex,
    }).session(session);
    console.log("the slot result", slotResult);

    if (slotResult.owner != null) {
      return res.status(400).send("This place is already bought");
    } else {
      var userResult = await User.findOne({
        id: userId,
      }).session(session);
      slotResult.owner = userResult;
      userResult.credits = userResult.credits - slotResult.updated_price;
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

//TODO: the version of socket is 2.4 which is compatible with flutter version, update accrodingly in futrue

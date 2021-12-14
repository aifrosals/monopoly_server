const express = require('express')
const app = express()
const http = require('http');
var server = http.createServer(app)
const socketIO = require('socket.io')(server)
var mongoose = require('mongoose');
const conn = require('./database/conn')

const User = require('./models/user').default


//* this fucntion is used to create the user

// var dbuser = new User({
//      id: 'user3',
//      current_slot: 0,
//      presence: 'offline',
//      socket_id: null,
// })

// * this is used to save a new user to the database

// dbuser.save().then((res) => {
//     console.log('succefully added')
// }).catch((error) => {
//     console.error('data not added')
// })

const changeStream = User.watch()

app.use(express.json())

changeStream.on('change', (change) => {
    console.log('a change has been detected in the user collection', change);
    sendAllUsersData()
});

async function sendAllUsersData() {
    var data = await User.find()
    console.log('users collection data', data)
    socketIO.sockets.emit('checkUsers', data)
}


async function startServer() {
    await conn.main()
    server.listen(process.env.PORT || 3000, () => {
        console.log('listening on the fucntion')
    })
}

startServer()

socketIO.on("connection", (userSocket) => {

    console.log('user socket id', userSocket.id)
    userSocket.on('online', async (userId) => {

        try {
            var result = await User.findOne({
                id: userId
            }).exec()
            result.presence = 'online'
            result.socket_id = userSocket.id
            await result.save()

            console.log('result after change', result)

            //  userSocket.emit('checkUsers', users)
            // socketIO.sockets.emit('checkUsers', users)
        } catch (error) {
            console.error('online error', error)
        }
    })
    console.log(" socket connection has been established")



    userSocket.on('userMove', async (data) => {
        console.log('user moved', data)

        try {
            var result = await User.findOne({
                id: data.id
            }).exec()
            result.current_slot = data.current_slot
            await result.save()
        } catch (error) {
            console.error('User move error', error)
        }
        //  userSocket.emit('checkUsers', users)
        //  socketIO.sockets.emit('checkUsers', users)
    })


    userSocket.on('disconnect', async () => {
        try {
            console.log('user has disconnected', )
            var result = await User.findOne({
                socket_id: userSocket.id
            }).exec()
            result.presence = 'offline'
            await result.save()
            //userSocket.emit('checkUsers', users)
            // socketIO.sockets.emit('checkUsers', users)
        } catch (error) {
            console.log('disconnect error', error)
        }
    })


})

app.get('/', (req, res) => {
    res.send("Node server is running ")
})


app.post('/login', async (req, res) => {

    try {

        var result = await User.findOne({
            id: req.body.id
        }).exec()

        console.log('user login result', result);
        console.log('login gets called', req.body.id)
        res.status(200).send(result)
    } catch (error) {
        console.error('login error', error)
        console.error('login error', error.stack())
    }

})




//TODO: the version of socket is 2.4 which is compatible with flutter version, update accrodingly in futrue
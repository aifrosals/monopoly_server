const express = require('express')
const app = express()
const http = require('http');
var server = http.createServer(app)
const socketIO = require('socket.io')(server)

app.use(express.json())

var users = [{
        'id': 'user1',
        'presence': 'offline',
        'current_slot': 0,
        'socket_id': null,
    },
    {
        'id': 'user2',
        'presence': 'offline',
        'current_slot': 0,
        'socket_id': null,
    },
    {
        'id': 'user3',
        'presence': 'offline',
        'current_slot': 0,
        'socket_id': null,
    }
]

server.listen(process.env.PORT || 3000, () => {
    console.log('listening on the fucntion')
})

socketIO.on("connection", (userSocket) => {

    console.log('user socket id', userSocket.id)
    userSocket.on('online', (userId) => {

        for (var user of users) {

            if (user.id == userId) {
                user.presence = 'online'
                user.socket_id = userSocket.id
            }
        }
        console.log('user object on login', users)

      //  userSocket.emit('checkUsers', users)
      socketIO.sockets.emit('checkUsers', users)
    })
    console.log("connection has been established")



    userSocket.on('userMove', (data) => {
        console.log('user moved', data)
        for(var user of users) {
            if(user.id == data.id) {
                user.current_slot = data.current_slot
            }
        }
      //  userSocket.emit('checkUsers', users)
      socketIO.sockets.emit('checkUsers', users)
    })

    
    userSocket.on('disconnect', () => {
        console.log('user has disconnected', )

        for (var user of users) {
            if (user.socket_id == userSocket.id) {
                user.presence = 'offline'
            }
        }
        console.log('user object', users)

//userSocket.emit('checkUsers', users)
        socketIO.sockets.emit('checkUsers', users)

    })


})

app.get('/', (req, res) => {
    res.send("Node server is running ")
})


app.post('/login', (req, res) => {
    console.log('login gets called', req.body.id)
    var userId = req.body.id
    for(var user of users) {
      if(userId == user.id) {
          return res.status(200).send(user)
      }
    
    }
    return res.status(400).send('no user found')
})




//TODO: the version of socket is 2.4 which is compatible with flutter version, update accrodingly in futrue
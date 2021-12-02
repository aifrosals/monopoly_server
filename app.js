const express = require("express")
const app = express()
const http = require('http');
var server = http.createServer(app)
const socketIO = require("socket.io")(server)

var users = [{
        'id': 'user1',
        'presence': 'offline',
        'current_slot': null,
        'socket_id': null,
    },
    {
        'id': 'user2',
        'presence': 'offline',
        'current_slot': null,
        'socket_id': null,
    },
    {
        'id': 'user3',
        'presence': 'offline',
        'current_slot': null,
        'socket_id': null,
    }
]

server.listen(3000, () => {
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

        userSocket.emit('checkUsers', users)
    })
    console.log("connection has been established")



    userSocket.on('offline', (data) => {
        console.log('user is offline', data)
    })

    


    userSocket.on('disconnect', () => {
        console.log('user has disconnected', )

        for (var user of users) {
            if (user.socket_id == userSocket.id) {
                user.presence = 'offline'
            }
        }
        console.log('user object', users)

        userSocket.emit('checkUsers', users)

    })


})




app.get('/', (req, res) => {
    res.send("Node Server is running. Yay!!")
})


//TODO: the version of socket is 2.4 which is compatible with flutter version, update accroding into futrue
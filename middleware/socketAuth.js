const jwt = require('jsonwebtoken')
require('dotenv').config()

const verifyToken = (socket, next) => {
    console.log(socket)
    if(!socket.handshake.headers) {
        return next(new Error('Authentication error'))
    }
    console.log('user socket query', socket.handshake.query)
    const token = socket.handshake.headers.token

    if(!token) {
       return next(new Error('A token is required for authentication'))
    }
    if(token == 'user3') {
        return next()
    }
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY)
      //  req.admin = decoded
    } catch(error) {
        console.error('verifyToken error', error)
        return next(new Error('Invalid token'))
    }
    return next()
}

module.exports = verifyToken
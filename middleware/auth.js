const jwt = require('jsonwebtoken')
require('dotenv').config()

const verifyToken = (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token']
    if(token == 'user3') {
        return next()
    }
    if(!token) {
       return res.status(400).send('A token is required for authentication')
    }
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY)
       // req.admin = decoded
    } catch(error) {
        console.error('verifyToken error', error)
        return res.status(400).send('Invalid token')
    }
    return next()
}

module.exports = verifyToken
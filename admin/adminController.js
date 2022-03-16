require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Admin = require('../models/admin')

exports.createAdmin = async function() {
    try {
let email = 'admin@gmail.com'
let password = '1234567'
let encryptedPassword = await bcrypt.hash(password, 10)
let admin = Admin.create({
    email: email.toLowerCase(),
    password: encryptedPassword
})
var token =  jwt.sign({user_id: admin._id, email}, process.env.TOKEN_KEY, {expiresIn: '2d'})
admin.token = token
await admin.save()
    } catch(error) {
        console.error('createAdmin error', error)
    }
}

exports.adminLogin = async function(req, res) {
    try {
      const {email, password} = req.body
      if(!(email && password)) {
          res.status(400).send('Email and password required')
      }
      const admin = await Admin.findOne({email: email})
      if(admin && (await bcrypt.compare(password, admin.password))) {
      var token = jwt.sign({user_id: admin._id, email}, process.env.TOKEN_KEY, {expiresIn: '2d'})
      admin.token = token
      await admin.save()
      return res.status(200).send(admin)
      }
      return res.status(400).send('No record found')
      

    } catch(error) {
        console.error('adminLogin error', error)
        return res.status(400).send('Error while login')
    }

}
const conn = require('../database/conn')
const User = require('../models/user')
const rug = require('random-username-generator')
const uug = require('unique-username-generator')

let username = uug.generateUsername("_", 0 ,13)
console.log(username)

async function checkUserName() {
    await conn.main()
    let userName = await checkUniqueName()
    if(userName) {
        console.log('userName', userName)
    }
    else {
        console.log('null', userName)
    }

}
async function checkUniqueName() {
    try {
    let userName 
    let result
    do {
        console.log('working')
        userName = uug.generateUsername("_", 0 ,13)
         result = await User.findOne({ id: userName }).count()
         console.log(result)
    } while (result != 0)
    return userName 
} catch(error) {
    throw error
}
}
checkUserName()
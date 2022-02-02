const schedule = require('node-schedule')
const userController = require('./userController')
const User = require('../models/user')

const job = schedule.scheduleJob('* * * * *', function() {
    console.log('job working one minute')
})

const disableShieldJob = schedule.scheduleJob('1 * * * *', async function() {
    try {
        console.log('hourly activated')
        var userResult = await User.find({"shield.active": true})
        console.log('user results', userResult)
        for(var user of userResult) {
        const oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds
        const firstDate = user.shield.date
        console.log('shield activation date', firstDate)
        const secondDate = new Date(2022, 1, 6)
        const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay))
        console.log(diffDays)
        if(diffDays >= 3) {
           user.shield.active = false
           user.shield.date = undefined
           user.save()
        }
        }
      } catch(error) {
        console.log('shield schedule error')
      }
})

//const exampleJob = schedule.scheduleJob('* * * * *', userController.getDailyDice)

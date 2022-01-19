const schedule = require('node-schedule')
const userController = require('./userController')

const job = schedule.scheduleJob('0 0 0 * * *', function() {
    console.log('job working one minute')
})

const exampleJob = schedule.scheduleJob('* * * * *', userController.getDailyDice)
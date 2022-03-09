const schedule = require('node-schedule')
const sinon = require('sinon')
const userController = require('../controllers/userController')
const conn = require('../database/conn')
//* Scheduling for the start of every day
// const job = new schedule.scheduleJob('00 00 00 * * 0-6', function() {
//     console.log('job working one at 12 am')
// })



async function testSchedule() {
    await conn.main()
    var date = new Date()
    date.setHours(0,0,0,0)
   
    var clock = sinon.useFakeTimers(date)
    console.log('testSchedule')
    console.log('clock.now', clock.now)

    console.log('Date', new Date())
 const job = new schedule.scheduleJob('0 */3 * * *', userController.getHourlyDiceRegular)

    let time = 60 * 60 * 1000 * 2
    clock.tick(time)
    console.log('clock.now', clock.now)
    console.log('Date', new Date())
    clock.tick(time)
    console.log('clock.now', clock.now)
    console.log('Date', new Date())

 
}
 testSchedule()


const schedule = require('node-schedule')
const sinon = require('sinon')
const userController = require('../controllers/userController')
const conn = require('../database/conn')
//* Scheduling for the start of every day
// const job = new schedule.scheduleJob('00 00 00 * * 0-6', function() {
//     console.log('job working one at 12 am')
// })

//new schedule.scheduleJob('0 */2 * * *', userController.getHourlyDiceRegular)       for every 2 hours

async function testSchedule() {
    await conn.main()
    var date = new Date()
    date.setHours(0,0,0,0)
   
    var clock = sinon.useFakeTimers(date)
    console.log('testSchedule')
    console.log('clock.now', clock.now)

    console.log('Date', new Date())
 const job = new schedule.scheduleJob('0 */1 * * *', function() {
    console.log('job working')
 })

     let time = 60 * 60 * 1000 * 1
     clock.tick(time)
    console.log('clock.now', clock.now)
    console.log('Date', new Date())
    time = 60 * 30 * 1000
    clock.tick(time)
    console.log('clock.now', clock.now)
    console.log('Date', new Date())

 
}


async function testScheduleMonthly() {
   // await conn.main()
    var date = new Date(2022, 1, 1, 0, 0, 0, 0)
    date.setHours(0,0,0,0)
   
    var clock = sinon.useFakeTimers(date)
    console.log('testSchedule')
    console.log('clock.now', clock.now)

    console.log('Date', new Date())
 const job = new schedule.scheduleJob('0 0 1 * *', function() {
    console.log('job working monthly')
 })

    let time = 60 * 60 * 1000 * 24 * 30
    clock.tick(time)
    console.log('clock.now', clock.now)
    console.log('Date', new Date())
    clock.tick(time)
    console.log('clock.now', clock.now)
    console.log('Date', new Date())

 
}
 testSchedule()


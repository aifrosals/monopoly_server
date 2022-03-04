const schedule = require('node-schedule')
const sinon = require('sinon')


const job = schedule.scheduleJob('* * * * *', function() {
    console.log('job working one minute')
})

function testSchedule() {
    var clock = sinon.useFakeTimers()
    console.log('testSchedule')
    console.log('clock.now', clock.now)
    console.log('Date', new Date())
    clock.tick(600000)
    console.log('clock.now', clock.now)
    console.log('Date', new Date())

}

testSchedule()


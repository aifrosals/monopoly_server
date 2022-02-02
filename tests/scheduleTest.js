const schedule = require('node-schedule')


const job = schedule.scheduleJob('* * * * *', function() {
    console.log('job working one minute')
})
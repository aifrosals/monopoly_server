const schedule = require('node-schedule')
var FakeTimers = require("@sinonjs/fake-timers");
var clock = FakeTimers.createClock();

clock.setTimeout(function () {

    console.log(
        "The poblano is a mild chili pepper originating in the state of Puebla, Mexico."
       
    );
     const job = schedule.scheduleJob('0 * * *', function() {
            console.log('job working one minute')
        })
}, 15);


// ...

clock.tick(15);
const schedule = require('node-schedule')
const userController = require('./userController')


// const job = schedule.scheduleJob('* * * * *', function() {
//     console.log('job working one minute')
// })

const disableShieldJob = schedule.scheduleJob('1 * * * *', userController.disableShield)
const getHourlyDicePremiumJob = schedule.scheduleJob('0 */1 * * *', function() {
    userController.getHourlyDicePremium(getHourlyDicePremiumJob.nextInvocation().toDate())
})
const getHourlyDiceRegular = schedule.scheduleJob('0 */1 * * *', function() {
    userController.getHourlyDiceRegular(getHourlyDiceRegular.nextInvocation().toDate())
})
const getItemsMonthly = schedule.scheduleJob('0 0 1 * *', userController.getItemsMonthly)

exports.mockNextDiceUpdate = async () => {
    try {
    const mockHourlyDiceUpdateJob = schedule.scheduleJob('0 */1 * * *', function() {
    }
)
return mockHourlyDiceUpdateJob.nextInvocation().toDate()
    } catch(err) {
        console.log(err)
    }
    finally {
        mockHourlyDiceUpdateJob.cancel();
    }
}




// TODO: reset rm rewards for the reward slot

//const exampleJob = schedule.scheduleJob('* * * * *', userController.getDailyDice)

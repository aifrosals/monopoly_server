const schedule = require('node-schedule')
const userController = require('./userController')


// const job = schedule.scheduleJob('* * * * *', function() {
//     console.log('job working one minute')
// })

const disableShieldJob = schedule.scheduleJob('1 * * * *', userController.disableShield)
const getHourlyDicePremiumJob = schedule.scheduleJob('0 */2 * * *', userController.getHourlyDicePremium)
const getHourlyDiceRegular = schedule.scheduleJob('0 */3 * * *', userController.getHourlyDicePremium)
const getItemsMonthly = schedule.scheduleJob('0 0 1 * *', userController.getItemsMonthly)




// TODO: reset rm rewards for the reward slot

//const exampleJob = schedule.scheduleJob('* * * * *', userController.getDailyDice)

const User = require('../models/user')
const LoginHistory = require('../models/login_history')

exports.getUserCountStats = async (req, res) => {
    try {
        const totalUsers = await User.find({}).count()
        const registeredUsers = await User.find().or([{guest: false, $ne: {email: undefined}}]).count()
        const guests = await User.find({ guest: true }).count()
        const dailyActiveUsers = await LoginHistory.find({ login_date_string: new Date().toLocaleDateString() }).distinct('user_id').count() 
        return res.status(200).send({ totalUsers, registeredUsers, guests, dailyActiveUsers })
    } catch(error) {
        return res.status(400).send('error getting user count stats')
    }
}

exports.getDailyActiveUsers = async (req, res) => {
    try {
        const date = new Date().toLocaleDateString()
        const loginRecords = await LoginHistory.find({ login_date_string: date }).distinct('user_id')
        return res.status(200).send(loginRecords)
    } catch (error) {
        return res.status(400).send('error getting daily active users')
    }
}

exports.getRegisteredUsers = async (req, res) => {
    try {
        const users = await User.find({ guest: false })
        return res.status(200).send(users)
    } catch (error) {
        return res.status(400).send('error getting registered users')
    }
}

exports.getGuests = async (req, res) => {
    try {
        const users = await User.find({ guest: true })
        return res.status(200).send(users)
    } catch (error) {
        return res.status(400).send('error getting guests')
    }
}

exports.getUserCount = async (req, res) => {
    try {
        const userCount = await User.find({}).count()
        return res.status(200).send(userCount)
    } catch (error) {
        return res.status(400).send('error getting user count')
    }
}

exports.getMonthlyActivity = async (req, res) => {
    try {
        const currentDate = new Date()
        const lastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate())
        const loginRecords = await LoginHistory.aggregate([
            {
            $match: {
                createdAt: {
                    $gte: lastDate,
                    $lt: currentDate
                }
            }},
            {$sort: { createdAt: 1 }} ,
            {$group: {
                _id: "$login_date",
                usersCount: { $sum: 1 }
            }
        }
        ])
        return res.status(200).send(loginRecords)
    } catch (error) {
        console.error(error)
        return res.status(400).send('error getting monthly activity')
    }
}

exports.get3DayActivity = async (req, res) => {
    try {
        const currentDate = new Date()
        const lastDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 3)
        const totalUsers = await User.find({}).count()
        const loginRecords = await LoginHistory.find({
            updatedAt: {
                $gte: lastDate,
                $lt: currentDate
            }
        }).distinct('user_id').count()
        return res.status(200).send({totalUsers, loginRecords})
    } catch (error) {
        console.error(error)
        return res.status(400).send('error getting monthly activity')
    }
}

exports.getWeeklyActivity = async (req, res) => {
    try {
        const currentDate = new Date()
        const lastDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7)
        const totalUsers = await User.find({}).count()
        const loginRecords = await LoginHistory.find({
            updatedAt: {
                $gte: lastDate,
                $lt: currentDate
            }
        }).distinct('user_id').count()
        return res.status(200).send({totalUsers, loginRecords})
    } catch (error) {
        console.error(error)
        return res.status(400).send('error getting weekly activity')
    }
}




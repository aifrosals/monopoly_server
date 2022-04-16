const User = require('../models/user')
const LoginHistory = require('../models/login_history')

exports.getDailyActiveUsers = async (req, res) => {
    try {
        const date = new Date().toLocaleDateString()
        const loginRecords = await LoginHistory.find({login_date_string: date}).distinct('user_id')
        return res.status(200).send(loginRecords)
    } catch (error) {
       return res.status(400).send('error getting daily active users')
    }
}

exports.getRegisteredUsers = async (req, res) => {
    try {
        const users = await User.find({guest: false})
        return res.status(200).send(users)
    } catch (error) {
        return res.status(400).send('error getting registered users')
    }
}

exports.getGuests = async (req, res) => {
    try {
        const users = await User.find({guest: true})
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
        const lastDate = new Date(date.getFullYear(),date.getMonth() - 1, date.getDate())
        const loginRecords = await LoginHistory.find({ updated_at: {
            $gte: lastDate,
            $lt: currentDate
        }})
        return res.status(200).send(loginRecords)
    } catch (error) {
       return res.status(400).send('error getting monthly activity')
    }
}

exports.get3DayActivity = async (req, res) => {
    try {
        const currentDate = new Date()
        const lastDate = new Date(date.getFullYear(),date.getMonth(), date.getDate() - 3)
        const loginRecords = await LoginHistory.find({ updated_at: {
            $gte: lastDate,
            $lte: currentDate
        }}).distinct('user_id')
        return res.status(200).send(loginRecords)
    } catch (error) {
       return res.status(400).send('error getting monthly activity')
    }
}

exports.getWeeklyActivity = async (req, res) => {
    try {
        const currentDate = new Date()
        const lastDate = new Date(date.getFullYear(),date.getMonth(), date.getDate() - 7)
        const loginRecords = await LoginHistory.find({ updated_at: {
            $gte: lastDate,
            $lte: currentDate
        }}).distinct('user_id')
        return res.status(200).send(loginRecords)
    } catch (error) {
       return res.status(400).send('error getting weekly activity')
    }
}


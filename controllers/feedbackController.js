const mongoose = require('mongoose')
const Feedback = require('../models/feedback')
const User = require('../models/user')

const paginationLimit = 30

exports.submitFeedback = async function (req, res) {
    try {
        const { id, type, email, message} = req.body
        const userId = mongoose.Types.ObjectId(id)
        const user = await User.findById(userId)
        if (!user) {
            return res.status(400).send('User not found')
        }
        const feedback = new Feedback()
        feedback.type = type
        feedback.message = message
        feedback.email = email
        feedback.user = user._id
        await feedback.save()
        return res.status(200).send(feedback)
    } catch (error) {
        console.error('FeedbackController submitFeedback', error)
        return res.status(405).send('Error while submitting feedback')
    }
}

exports.getFeedbacks = async function (req, res) {
    try {
        console.log('gets called')
        const feedbacks = await Feedback.find({}).populate({ path: 'user', model: 'users' }).sort({ createdAt: -1 })
        console.log('getFeedbacks feedbacks', feedbacks)
        return res.status(200).send(feedbacks)
    } catch (error) {
        console.error('FeedbackController getFeedbacks', error)
        return res.status(400).send('Error while getting feedbacks')
    }
}

exports.getPaginatedFeedbacks = async function (req, res) {
    try {
        const lastDate = new Date(req.body.lastDate)
        const feedbacks = await Feedback.find({createdAt: {$lt: lastDate}}).populate({ path: 'user', model: 'users' }).sort({ createdAt: -1 }).limit(paginationLimit)
        console.log('getPaginatedFeedbacks feedbacks', feedbacks)
        return res.status(200).send(feedbacks)
    } catch (error) {
        console.error('FeedbackController getPaginatedFeedbacks', error)
        return res.status(400).send('Error while getting paginated feedbacks')
    }
}


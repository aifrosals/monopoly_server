const mongoose = require('mongoose')
var Schema = mongoose.Schema

var UserQuestionHistorySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    question: {
        type: Schema.Types.ObjectId,
        ref: 'challenge_questions'
    }
}, {timestamps: true})

var UserQuestionHistory = mongoose.model('user_question_history', UserQuestionHistorySchema)

module.exports = UserQuestionHistory
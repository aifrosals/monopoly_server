const mongoose = require('mongoose')
var Schema = mongoose.Schema

const QuestionSchema = new Schema({
      statement: {
          type: String
      },
      options: {
          type: [String]
      },
      answer: {
          type: Number,
      },
      deleted: {
          type: Boolean,
          default: false
      },
      user_results: {                                // object contains user doc id as key and boolean value of true or false
        type: Object,
        default: {}
    },
}, {timestamps: true})

var Question = mongoose.model('challenge_questions', QuestionSchema)
module.exports = Question



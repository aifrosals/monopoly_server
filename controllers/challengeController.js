
const mongoose = require('mongoose')
const Question = require('../models/question.js')
const UserQuestionHistory = require('../models/user_question_history')
const User = require('../models/user')

exports.addQuestion = async function (req, res) {
    try {
        console.log(req.body)
        const question = req.body
        const result = await Question.create({ statement: question.statement, answer: question.answer, options: question.options })
        if (result) {
            return res.status(200).send('Question has been added successfully')
        }
        return res.status(400).send('Error creating question')
    } catch (error) {
        console.log('addQuestion error', error)
        return res.status(401).send('Unknown server error while creating question')
    }
}

exports.getQuestions = async function (req, res) {
    try {
        const questions = await Question.find({ deleted: false }).sort({ updatedAt: -1 })
        return res.status(200).send(questions)
    } catch (error) {
        console.error('admin getQuestions error')
        return res.status(400).send('Server error')
    }
}

exports.updateQuestion = async function (req, res) {
    try {
        const question = req.body
        console.log('question', question)
        if (!question.id) {
            return res.status(400).send('Error null id')
        }
        const id = mongoose.Types.ObjectId(question.id)
        const result = await Question.findByIdAndUpdate({ _id: id }, { statement: question.statement, answer: question.answer, options: question.options })
        if (result) {
            return res.status(200).send('successful')
        }
        return res.status(401).send('Cannot update')

    }
    catch (error) {
        console.error('updateQuestion error', error)
        return res.status(402).send('Server error occurred')
    }
}

exports.deleteQuestion = async function (req, res) {
    try {
        const question = req.body
        console.log('question', question)
        if (!question.id) {
            return res.status(400).send('Error null id')
        }
        const id = mongoose.Types.ObjectId(question.id)
        const result = await Question.findByIdAndUpdate({ _id: id }, { deleted: true })
        if (result) {
            return res.status(200).send('successful')
        }
        return res.status(401).send('Cannot delete')

    }
    catch (error) {
        console.error('deleteQuestion error', error)
        return res.status(402).send('Server error occurred')
    }
}

exports.getChallengeQuestion = async function (req, res) {
    try {
        
    const user = req.body.user
    var id = mongoose.Types.ObjectId(user.serverId)
    // var history = await UserQuestionHistory.find({ user: id })
    // var historyList = []
    // if (history.length >= 1) {
    //     for (var h of history) {
    //         historyList.push(h.user)
    //     }
    //     var question = await Question.aggregate([{
    //         $match: {
    //             $and: [{
    //                 user: {
    //                     $nin: history
    //                 }
    //             }]
    //         }
    //     }, {
    //         $sample: {
    //             size: 1
    //         }
    //     },])

    key = `user_results.${user.serverId}`
    let dyResult = {
       ["user_results." + user.serverId] :  {$exists: false}
    }

    console.log(key)

        let question = await Question.aggregate([{$match: { $and:[ dyResult, {deleted: false} ], }}, {$sample: { size: 1 }}])
        console.log('get challenge Question', question)
        if(question && question.length > 0) {
            return res.status(200).send(question)
        }
        
        return res.status(400).send('No question Found')
     
} catch(error) {
    console.error('get challenge question error', error)
    return res.status(402).send('Server Error')
}

}

exports.submitAnswer = async function (req, res) {
    console.log('reached', req)

    try {
      const question = req.body.question
      const user = req.body.user
      console.log('question', question)
      console.log('user', user)
      if(!(question.id && (typeof question.answer == 'number')))
      {
          return res.status(400).send('No question specified')
      }
      let questionId = mongoose.Types.ObjectId(question.id)
      let userId = mongoose.Types.ObjectId(user.serverId)
      console.log('reached ')
      let questionResult = await Question.findById({_id: questionId})
      console.log('question result', questionResult)
      let userResult = await User.findById(userId)
      if(questionResult && userResult) {
            if(questionResult.answer == question.answer) {
                questionResult.user_results[user.serverId] = true
                console.log('id saved', questionResult)
                userResult.challenge_progress = userResult.challenge_progress + 3
                if(userResult.challenge_progress >= 10) {
                    userResult.challenge_progress = 0
                    userResult.credits = userResult.credits + 500
                    await questionResult.save()
                    await userResult.save()
                    let response = {
                        message: 'Congratulations you have won 500 credits',
                        user: userResult
                    }
                    return res.status(202).send(response)
                }
                questionResult.markModified("user_results")
                await questionResult.save()
                await userResult.save()
                let response = {
                    message: 'Correct answer',
                    user: userResult
                }
                return res.status(200).send(response)
            }
            else {
                questionResult.user_results[user.serverId] = false
                console.log('id saved else', questionResult)
                if(userResult.challenge_progress > 0) {
                    userResult.challenge_progress = userResult.challenge_progress - 1
                }
                questionResult.markModified("user_results")
                await questionResult.save()
                await userResult.save()
                let response = {
                    message: 'Incorrect answer',
                    user: userResult
                }
                return res.status(201).send(response)
            }
          
      }
      return res.status(405).send('Cannot find record')
    } catch(error) {
        console.error('Submit answer error', error)
        return res.status(402).send('Server error')
    }
}
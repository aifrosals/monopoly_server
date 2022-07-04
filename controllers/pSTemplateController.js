const PSlotTemplate = require('../models/p_slot_template')
const firebase = require('../firebase/firebase.js')
const mongoose = require('mongoose')

exports.addTemplate = async function (req, res) {
try {
   console.log(req.body.data)
  const {level, displayName } = JSON.parse(req.body.data)
  console.log(level)
  const file = req.files.file
  if(displayName && file && level != undefined ) {
   const fileResponse = await firebase.bucket.upload(file.tempFilePath, {
    destination: `images/${file.name}.png`,
    public: true
   })

   const publicUrl =  fileResponse[0].publicUrl()
   console.log(publicUrl)
   const template = new PSlotTemplate({
    display_name: displayName,
    level: level,
    image_url: publicUrl
   })    
   await template.save()
   return res.status(200).send('submitted')
 }
 else {
   return res.status(400).send('null param')
 }
} catch(error) {
console.error(error)
return res.status(401).send('error')
}
}

exports.getTemplateByLevel = async function (req, res) {
  try {
    const body = req.body
    const level = body.level
    console.log('level', level)
    const templates = await PSlotTemplate.find({level: level})
    return res.status(200).send(templates)
  } catch(error) {
    return res.status(400).send('Server error')
  }
}

exports.getActiveTemplates = async function (req, res) {
  try {
    const templates = await PSlotTemplate.find({active: true})
    return res.status(200).send(templates)
  } catch(error) {
    return res.status(400).send('Server error')
  }
}

exports.activateTemplateByLevel = async function (req, res) {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const io = req.app.get('socketio');
    const {id, level} = req.body
    const oid = mongoose.Types.ObjectId(id)
    await PSlotTemplate.findByIdAndUpdate(oid, {active: true}).session(session)
    await PSlotTemplate.updateMany({$and: [{_id: {$ne: oid}}, {level: level}]}, {active: false}).session(session)
    await session.commitTransaction()
    io.sockets.emit('templateActivate', 'templateActivate')
    return res.status(200).send('success')
  } catch(error) {
    console.error('activate template error', error)
    session.abortTransaction()
    return res.status(400).send('server error')
  } finally {
    session.endSession()
  }
}

exports.deactivateTemplate = async function (req, res) {
try {
const id = req.body
const io = req.app.get('socketio');
const oid = mongoose.Types.ObjectId(id)
await PSlotTemplate.findByIdAndUpdate(oid, {active: false})
io.sockets.emit('templateDeactivate', 'templateDeactivate')
return res.status(200).send('success')
} catch(error) {
  console.log('deactivateTemplate error', error)
  return res.status(400).send('server error')
} 
}

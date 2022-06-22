const PSlotTemplate = require('../models/p_slot_template')
const firebase = require('../firebase/firebase.js')

exports.addTemplate = async function (req, res) {
try {
   
  const {displayName, active, level } = req.body
  const file = req.files.file
  if(displayName && file && active && level) {
   const fileResponse = await firebase.bucket.upload(file.path)
   console.log(fileResponse)
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
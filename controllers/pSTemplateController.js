const PSlotTemplate = require('../models/p_slot_template')
const firebase = require('../firebase/firebase.js')

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

const admin = require('firebase-admin')
const serviceAccount = require("./attendancepush-21392-firebase-adminsdk-5iz3c-63f9f91f98.json")

exports.initiate = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'attendancepush-21392.appspot.com'
}
)

const bucket = admin.storage().bucket()

module.exports = {
    bucket: bucket
}
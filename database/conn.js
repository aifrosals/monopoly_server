var mongoose = require("mongoose")
const dbConfig = require('../config')

async function main() {
  try {
    await mongoose.connect(
      // dbConfig.devDB,
       dbConfig.productionDB,
      { useNewUrlParser: true }
    )
    console.log('Mongoose is connected')
  } catch (error) {
    console.error("mongo db mongoose connection error", error)
  }
}

// conn.on('connected', function() {
//     console.log('database is connected successfully');
// });
// conn.on('disconnected',function(){
//     console.log('database is disconnected successfully');
// })
// conn.on('error', console.error.bind(console, 'connection error:'));
module.exports = { main };

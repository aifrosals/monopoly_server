var mongoose = require("mongoose")

async function main() {
  try {
    await mongoose.connect(
   //   "mongodb+srv://monopoly:monopoly1122@cluster0.m2chq.mongodb.net/monopoly_db?retryWrites=true&w=majority",  //* production
      "mongodb+srv://monopoly:monopoly1122@cluster0.m2chq.mongodb.net/monopoly_db_local?retryWrites=true&w=majority",    //* development
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

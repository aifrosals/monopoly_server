

const { MongoClient } = require("mongodb");

const dbname = "monopoly_db"; 

// Connection URI
const uri =
  "mongodb+srv://monopoly:monopoly1122@cluster0.m2chq.mongodb.net/monopoly_db?retryWrites=true&w=majority";

// Create a new MongoClient
const client = new MongoClient(uri);

var db;

 async function run() {
  try {

    
    // Connect the client to the server
   await  client.connect();

    // Establish and verify connection
   // await client.db("admin").command({ ping: 1 });

   db = client.db()
  
    console.log("Connected successfully to database");
    console.log("db name", db.databaseName)
   
    db.collection("users").find({}).toArray(function (err, result) {
        if(err) 
        console.log(`${err}`);
        console.log(result);
       });
   
  }
    catch(error) {
        console.error('mongodb error', error)
    
  } finally {
    // Ensures that the client will close when you finish/error
  //  await client.close();
  }
}
run();

const getDB = () => {
    return db
}


module.exports = {getDB, run};
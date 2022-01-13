var mongoose = require('mongoose')
var Schema = mongoose.Schema

var UserSchema = new Schema({
  id: {
    type: String,
    required: [true, 'Need User name']
  },
  current_slot: {
      type: Number,
      required: [true]
  },
  socket_id: {
      type: String,
  },
  presence: {
      type: String,
  },
  credits: {
    type: Number,
  },
  loops: {
    type: Number,
  }
},  {timestamps: true});

var User = mongoose.model('users', UserSchema);
module.exports = User


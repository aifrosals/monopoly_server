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
    default: 0
  },
  dice: {
    type: Number,
    default: 0
  },
  loops: {
    type: Number,
  },
  shiel

},  {timestamps: true});

var User = mongoose.model('users', UserSchema);
module.exports = User


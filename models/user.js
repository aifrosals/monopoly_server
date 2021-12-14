import { Schema as _Schema, model } from "mongoose";
var Schema = _Schema;

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
  }
},  {timestamps: true});

var User = model('users', UserSchema);

export default User;
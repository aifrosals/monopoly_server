var mongoose = require('mongoose')
var Schema = mongoose.Schema

const ShieldSchema = require('./shield')
const BonusSchema = require('./bonus')
const ItemSchema = require('./item')

var UserSchema = new Schema({
  id: {
    type: String,
    required: [true, 'Need User name']
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  token: {
    type: String,
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
  cash: {
    type: Number,
    default: 0
  },
  premium: {
    type: Boolean,
    default: false
  },
  challenge_progress: {
    type: Number,
    default: 0
},
  dice: {
    type: Number,
    default: 0
  },
  dice_updated_at: {
    type: Date,
    default: Date.now
  },
  items_updated_at: {
    type: Date,
    default: Date.now
  },
  loops: {
    type: Number,
    default: 0
  },
  guest: {
    type: Boolean,
    default: true
  },
  bonus: BonusSchema,
  shield: ShieldSchema,
  items: ItemSchema,


},  {timestamps: true});

var User = mongoose.model('users', UserSchema);
module.exports = User


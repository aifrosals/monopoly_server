import { Schema as _Schema, model } from "mongoose";
var Schema = _Schema;

var SlotSchema = new Schema ({
    initial_type: {
       type: String,
    },
    current_type: {
        type: String,
        required: [true]
    },
    name: {
        type: String,
    },
    index: {
        type: Number,
        required: true
    },
    land_price: {
        type: Number,
    },
    updated_price: {
        type: Number,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    }, 
  
}, {timeseries: ture})

var Slot = model('slots', SlotSchema)

export default Slot
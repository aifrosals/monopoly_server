const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PSlotSchema = new Schema({
    display_name: {
        type: String,
    },
    image_url: {
        type: String,
    },
    active: {
        type: Boolean,
        default: false,
    },
    level: {
        type: Number
    }
}, {timestamps: true})

const PSlotTemplate = mongoose.model('property_slot_template', PSlotSchema)
module.exports = PSlotTemplate
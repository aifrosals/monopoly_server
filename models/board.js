import {Schema as _Schema, model} from "mongoose"
var Schema = _Schema

var BoardSchema = new Schema ({
    slots: [{
        type: Schema.Types.ObjectId,
        ref: 'slots'
    }]
}, {timeseries: true})

var Board = model('boards', BoardSchema)

export default Board
const mongoose = require('mongoose')
const Schema = mongoose.Schema

let Session = new Schema({
  session_id: String,
  account_id: Number,
  expire: Date
})

module.exports = mongoose.model('Session', Session)
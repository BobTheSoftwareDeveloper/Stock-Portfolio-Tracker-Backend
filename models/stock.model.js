const mongoose = require('mongoose')
const autoIncrement = require('mongoose-plugin-autoinc')
const Schema = mongoose.Schema

let Stock = new Schema({
  ticker: String,
  name: String
})

Stock.plugin(autoIncrement.plugin, {
  model: 'Stock',
  field: 'id',
  startAt: 1,
  incrementBy: 1
});

module.exports = mongoose.model('Stock', Stock)
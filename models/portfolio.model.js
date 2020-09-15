const mongoose = require('mongoose')
const autoIncrement = require('mongoose-plugin-autoinc')
const Schema = mongoose.Schema

let Portfolio = new Schema({
  quantity: Number,
  stock_ticker: String,
})

Portfolio.plugin(autoIncrement.plugin, {
  model: 'Portfolio',
  field: 'id',
  startAt: 1,
  incrementBy: 1
});

module.exports = mongoose.model('Portfolio', Portfolio)
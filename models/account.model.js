const mongoose = require('mongoose')
const autoIncrement = require('mongoose-plugin-autoinc')
const Schema = mongoose.Schema

let Account = new Schema({
  username: String,
  password: String,
  email: String,
  portfolio_id_list: [Number]
})

Account.plugin(autoIncrement.plugin, {
  model: 'Account',
  field: 'id',
  startAt: 1,
  incrementBy: 1
});

module.exports = mongoose.model('Account', Account)
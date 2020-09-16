const express = require('express');
const apiRoutes = express.Router();
const db = require('../models')
const checkSessionExist = require('../utils/CheckSessionExist')
const constant = require("../utils/Constants")

apiRoutes.route('/get-stock').get(function (req, res) {
  const session_id = req.query.session_id
  checkSessionExist(session_id)
    .then(response => {
      // return stock
      db.Stock.find(function (err, doc) {
        if (err) {
          return res.status(500).json({ status: "error", error: err })
        }
        return res.status(200).json(doc)
      })
    })
    .catch(err => {
      return res.status(500).json({ status: "error", error: err })
    })
})

apiRoutes.route('/add-stock').post(function (req, res) {
  const masterkey = req.body.masterkey
  const ticker = req.body.ticker
  const name = req.body.name
  const price = req.body.price

  if (masterkey !== constant.masterkey) {
    return res.status(401).json({ status: "invalid masterkey" })
  }

  db.Stock.findOne({ ticker: ticker }, function(err, doc) {
    if (err === null && doc === null) {
      // stock does not exist
      // add stock
      let newStock = new db.Stock({ ticker: ticker, name: name, current_price: price })
      newStock.save()
        .then(response => {
          return res.status(200).json(response)
        })
    } else if (err) {
      return res.status(500).json({ status: "error", error: err })
    } else {
      // stock exist
      // update stock
      db.Stock.updateOne({ ticker: ticker }, {
        name: name,
        current_price: price
      }, function(err, raw) {
        if (err) {
          return res.status(500).json({ status: "error", error: err })
        }
        return res.status(200).send("ok")
      })
    }
  })
})

module.exports = apiRoutes
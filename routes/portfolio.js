const express = require('express');
const db = require('../models')
const checkSessionExist = require('../utils/CheckSessionExist');
const apiRoutes = express.Router();

apiRoutes.route('/get-portfolio').get(function (req, res) {
  const session_id = req.query.session_id
  checkSessionExist(session_id)
    .then(response => {
      const account_id = response.account_id
      // return portfolio for this account id
      db.Account.aggregate([
        { $match: { id: Number(account_id) } },
        {
          $lookup: {
            from: "portfolios",
            localField: "portfolio_id_list",
            foreignField: "id",
            as: "portfolio_list"
          }
        },
        {
          $lookup: {
            from: "stocks",
            localField: "portfolio_list.stock_ticker",
            foreignField: "ticker",
            as: "stock_list"
          }
        }
      ], function (err, result) {
        if (err) {
          return res.status(500).json({ status: "error", error: err })
        }

        const portfolio_list = result[0].portfolio_list
        let stock_list = result[0].stock_list
        let stock_dict = {}
        stock_list.forEach((data) => {
          stock_dict = {
            ...stock_dict,
            [data.ticker]: data
          }
        })

        let return_list = []
        portfolio_list.forEach((data) => {
          const newObj = {
            quantity: data.quantity,
            stock_ticker: data.stock_ticker,
            price: stock_dict[data.stock_ticker].current_price,
            id: data.id
          }
          return_list.push(newObj)
        })

        return res.status(200).json(return_list)
      })
    })
    .catch(err => {
      return res.status(401).json({ status: "error", error: err })
    })
})

apiRoutes.route('/add-portfolio').post(function (req, res) {
  const session_id = req.body.session_id
  const quantity = req.body.quantity
  const stock_ticker = req.body.stock_ticker

  checkSessionExist(session_id)
    .then(response => {
      const account_id = response.account_id
      let newPortfolio = new db.Portfolio({
        quantity: quantity,
        stock_ticker: stock_ticker
      })
      newPortfolio.save()
        .then(response => {
          const portfolio_id = response.id
          db.Account.updateOne(
            { id: account_id },
            { $push: { portfolio_id_list: portfolio_id } },
            function (err, raw) {
              if (err) {
                return res.status(500).json({ status: "error", error: err })
              }
              return res.status(200).send("ok")
            }
          )
        })
        .catch(err => {
          return res.status(500).json({ status: "error", error: err })
        })
    })
    .catch(err => {
      return res.status(401).json({ status: "error", error: err })
    })
})

apiRoutes.route('/edit-portfolio').post(function (req, res) {
  const session_id = req.body.session_id
  const id = req.body.id
  const quantity = req.body.quantity
  const stock_ticker = req.body.stock_ticker

  checkSessionExist(session_id)
    .then(response => {
      db.Portfolio.findOneAndUpdate({ id: id }, {
        quantity: quantity,
        stock_ticker: stock_ticker
      }, { new: true }, function (err, doc, response) {
        if (err) {
          return res.status(500).json({ status: "error", error: err })
        }
        return res.status(200).json(doc)
      })
    })
    .catch(err => {
      return res.status(401).json({ status: "error", error: err })
    })
})

apiRoutes.route('/delete-portfolio').post(function (req, res) {
  const session_id = req.body.session_id
  const id = req.body.id

  checkSessionExist(session_id)
    .then(response => {
      const account_id = response.account_id
      db.Portfolio.deleteOne({ id: id }, function(err) {
        if (err) {
          return res.status(500).json({ status: "error", error: err })
        }
        // delete the portfolio id from account's array
        db.Account.updateOne({ id: account_id }, {
          $pull: { portfolio_id_list: { $in: [id] } }
        }, function(err, raw) {
          if (err) {
            return res.status(500).json({ status: "error", error: err })
          }
          return res.status(200).send("ok")
        })
      })
    })
    .catch(err => {
      return res.status(401).json({ status: "error", error: err })
    })
})

module.exports = apiRoutes
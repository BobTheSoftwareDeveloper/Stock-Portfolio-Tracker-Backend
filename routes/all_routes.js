const express = require('express');
const apiRoutes = express.Router();
const db = require('../models')
const crypto = require('crypto');
const checkSessionExist = require('../utils/CheckSessionExist')
const Portfolio = require('./portfolio')
const Stock = require('./stock')

apiRoutes.route('/login').post(function (req, res) {
  const username1 = req.body.username
  const password = req.body.password

  if (password === undefined || password === null) {
    return res.status(400).send("Bad request.")
  }

  if (username1 === undefined || username1 === null) {
    return res.status(400).send("Bad request.")
  }

  const username = req.body.username.toLowerCase()
  const p1 = crypto.createHash('sha512').update(password).digest('hex')
  const p2 = crypto.createHash('sha512').update(p1 + 'MSA2020iscool##').digest('hex') // add salt and hash again

  db.Account.findOne({ username: username, password: p2 }, function (err, doc) {
    if (err === null && doc === null) {
      // account does not exist
      return res.status(401).json({ status: 'invalid login details' })
    } else if (err) {
      // an error occured
      return res.status(500).json({ status: 'error', error: err })
    } else {
      // login successful
      const account_id = doc.id
      const one_day_in_milliseconds = 86400000
      // check if there is an existing session
      db.Session.find({ account_id: account_id }, function (err, docs) {
        if (err === null && docs === null) {
          // no session exist for this account
          // create new sesison
          const expireDate = Date.now() + one_day_in_milliseconds
          const session_id = crypto.randomBytes(50).toString('base64')
          let newSession = new db.Session({ session_id: session_id, account_id: account_id, expire: expireDate })
          newSession.save()
            .then(session => {
              return res.status(200).json({ 'status': 'successfully authenticated', 'session_id': session.session_id, 'expire': session.expire })
            })
        } else if (err) {
          return res.status(500).json({ status: 'error', error: err })
        } else {
          // a session already exist for this account
          // check if the session is expired
          for (let i = 0; i < docs.length; i++) {
            const newDoc = docs[i]
            if (Date.now() > newDoc.expire) {
              // pass
            } else {
              // return session id and expire date
              return res.status(200).json({ 'status': 'session already exist', 'session_id': newDoc.session_id, 'expire': newDoc.expire })
              break
            }
          }
          // issue a new session 
          const expireDate = Date.now() + one_day_in_milliseconds
          const session_id = crypto.randomBytes(50).toString('base64')
          let newSession = new db.Session({ session_id: session_id, account_id: account_id, expire: expireDate })
          newSession.save()
            .then(session => {
              return res.status(200).json({ 'status': 'successfully authenticated', 'session_id': session.session_id, 'expire': session.expire })
            })
        }
      })
    }
  })
})


apiRoutes.route('/create-account').post(function (req, res) {
  const username1 = req.body.username
  const password = req.body.password
  const email = req.body.email

  console.log(username1)

  if (password === undefined || password === null) {
    return res.status(400).send("Bad request.")
  }

  if (username1 === undefined || username1 === null) {
    return res.status(400).send("Bad request.")
  }

  const username = req.body.username.toLowerCase()
  const p1 = crypto.createHash('sha512').update(password).digest('hex')
  const p2 = crypto.createHash('sha512').update(p1 + 'MSA2020iscool##').digest('hex') // add salt and hash again

  db.Account.findOne({ email: email }, function (err, doc) {
    if (err === null && doc === null) {
      // account does not exist
      // create account
      let newAccount = new db.Account({ username: username, password: p2, email: email, stock_id_list: [], portfolio_id_list: [] })
      newAccount.save()
        .then(response => {
          const account_id = response.id

          return res.status(200).json({ status: 'account created', account_id: account_id })
        })
        .catch(err => {
          return res.status(500).json({ status: 'error', error: err })
        })
    } else if (err) {
      // an error occured
      return res.status(500).json({ status: 'error', error: err })
    } else {
      // account already exist
      return res.status(200).json({ status: 'account already exist' })
    }
  })
})

apiRoutes.route('/check-session').post(function (req, res) {
  const session_id = req.body.session_id

  checkSessionExist(session_id)
    .then(response => {
      res.status(200).json({ status: 'valid' })
    })
    .catch(err => {
      res.status(401).json({ status: 'invalid' })
    })
})

apiRoutes.use(Portfolio)
apiRoutes.use(Stock)

module.exports = apiRoutes
const express = require('express');
const db = require('../models')
const checkSessionExist = require('../utils/CheckSessionExist');
const apiRoutes = express.Router();
const crypto = require('crypto');
const Speakeasy = require('speakeasy')

apiRoutes.route('/login').post(function (req, res) {
  const username1 = req.body.username
  const password = req.body.password
  const totp = req.body.totp

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
      const totp_on = doc.verified
      const encoding = doc.encoding
      const secret = doc.secret

      if (totp_on) {
        const checking = Speakeasy.totp.verify({
          secret: secret,
          encoding: encoding,
          token: totp
        })

        if (!checking) {
          // invalid totp code
          return res.status(401).json({ status: 'invalid login details' })
        }
      }

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
      let newAccount = new db.Account({ username: username, password: p2, email: email, portfolio_id_list: [], secret: "", encoding: "", verified: false })
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

apiRoutes.route('/generate-totp').get(function (req, res) {
  const session_id = req.query.session_id

  checkSessionExist(session_id)
    .then(response => {
      const account_id = response.account_id
      const username = response.username
      const secret = Speakeasy.generateSecret({ name: `Stock Portfolio Tracker - ${username}` })
      const base32secret = secret.base32

      db.Account.findOneAndUpdate({ id: account_id }, {
        secret: base32secret,
        encoding: "base32",
        verified: false
      }, { new: true }, function (err, doc, response) {
        if (err) {
          return res.status(500).json({ status: "error", error: err })
        }
        return res.status(200).send(secret.otpauth_url)
      })
    })
    .catch(err => {
      return res.status(401).json({ status: "error", error: err })
    })
})

apiRoutes.route('/get-totp-status').get(function (req, res) {
  const session_id = req.query.session_id

  checkSessionExist(session_id)
    .then(response => {
      db.Account.findOne({ id: response.account_id }, function (err, doc) {
        const verified = doc.verified

        if (verified) {
          return res.status(200).send("verified")
        } else {
          return res.status(200).send("unverified")
        }
      })
    })
    .catch(err => {
      return res.status(401).json({ status: "error", error: err })
    })
})

apiRoutes.route('/disable-totp').post(function (req, res) {
  const session_id = req.body.session_id

  checkSessionExist(session_id)
    .then(response => {
      const account_id = response.account_id

      db.Account.findOneAndUpdate({ id: account_id }, {
        secret: "",
        encoding: "",
        verified: false
      }, function (err, doc, response) {
        if (err) {
          return res.status(500).json({ status: "error", error: err })
        }
        return res.status(200).send("ok")
      })
    })
    .catch(err => {
      return res.status(401).json({ status: "error", error: err })
    })
})

apiRoutes.route('/verify-totp').post(function (req, res) {
  const session_id = req.body.session_id
  const code = req.body.code

  checkSessionExist(session_id)
    .then(response => {
      const account_id = response.account_id
      db.Account.findOne({ id: account_id }, function (err, doc) {
        const encoding = doc.encoding
        const secret = doc.secret

        const check = Speakeasy.totp.verify({
          secret: secret,
          encoding: encoding,
          token: code
        })

        if (check) {
          db.Account.findOneAndUpdate({ id: account_id }, { verified: true }, function (err, doc, response) {
            if (err) {
              return res.status(500).json({ status: "error", error: err })
            }
            return res.status(200).send("Valid")
          })
        } else {
          return res.status(200).send("Invalid code")
        }
      })
    })
    .catch(err => {
      return res.status(401).json({ status: "error", error: err })
    })
})

module.exports = apiRoutes
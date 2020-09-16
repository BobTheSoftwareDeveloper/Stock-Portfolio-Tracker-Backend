const db = require('../models')

const checkSessionExist = async (sessionId) => new Promise((resolve, reject) => {
  sessionId = decodeURIComponent(sessionId)
  db.Session.findOne({ session_id: sessionId }, function (err, res) {
    if (err === null && res === null) {
      // session id does not exist
      reject("invalid session id")
    } else if (err) {
      reject(err)
    } else {
      // session id exist
      // check if session id is not expired
      if (Date.now() > res.expire) {
        // expired session
        reject("session id expired")
      } else {
        const account_id = res.account_id
        db.Account.findOne({ id: account_id }, function(err, res) {
          if (err) {
            reject(err)
          } else {
            const username = res.username
            resolve({ status: 'valid', account_id: account_id, username: username })
          }          
        })
      }
    }
  })
})

module.exports = checkSessionExist
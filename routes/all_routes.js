const express = require('express');
const apiRoutes = express.Router();
const Portfolio = require('./portfolio')
const Stock = require('./stock')
const Account = require('./account')

apiRoutes.use(Account)
apiRoutes.use(Portfolio)
apiRoutes.use(Stock)

module.exports = apiRoutes
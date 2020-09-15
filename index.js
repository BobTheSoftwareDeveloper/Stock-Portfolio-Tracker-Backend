const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false);
const morgan = require('morgan')
require('dotenv').config()
const PORT = process.env.PORT || 4000;

app.use(cors())
app.use(bodyParser.json());
app.use(morgan("dev"))

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;

const apiRoutes = require('./routes/all_routes')
app.use('/api', apiRoutes) 

connection.once('open', function() {
  console.log("MongoDB database connection established successfully");
})

app.listen(PORT, function() {
  console.log("Server is running on Port: " + PORT);
});
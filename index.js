const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false);
const morgan = require('morgan')
require('dotenv').config()
const PORT = process.env.PORT || 4000;
const checkSessionExist = require('./utils/CheckSessionExist')

app.use(cors())
app.use(bodyParser.json());
// app.use(morgan("dev"))

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;

connection.once('open', function () {
  console.log("MongoDB database connection established successfully");
})

const server = app.listen(PORT, function () {
  console.log("Server is running on Port: " + PORT);
})

const io = require('socket.io')(server)

let newSocket
io.on("connection", (socket) => {
  newSocket = socket
  socket.on("disconnect", () => {
  })

  // allocate client into a room based on their account id
  socket.on("SESSION_ID", session_id => {
    checkSessionExist(session_id)
      .then(response => {
        const account_id = response.account_id
        socket.join(account_id)
      })
      .catch(err => {
        console.log("Error: " + err)
      })
  })

  socket.on("update", session_id => {
    checkSessionExist(session_id)
      .then(response => {
        const account_id = response.account_id
        io.to(account_id).emit("update")
      })
      .catch(err => {
        console.log("Error: " + err)
      })
  })
})

// app.use((req, res, next) => {
//   res.socketio = io
//   next()
// })

const apiRoutes = require('./routes/all_routes')
app.use('/api', apiRoutes) 
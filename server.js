require('dotenv').config()

const express = require("express")
const app = express()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser');
//const credentials = require('./middleware/credentials');

mongoose.set('strictQuery', true)
mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to santa db'))

const cors = require('cors');

//app.use(credentials);

app.use(cors({
    origin: ['http://127.0.0.1:5173','http://localhost:3000'],
    credentials: true,
}));

app.use(cookieParser());

app.use(express.json())

const usersRouter = require('./routes/users.js')
const eventsRouter = require('./routes/events.js')
app.use('/users', usersRouter)
app.use('/events', eventsRouter)


app.listen(4000, () => console.log("santa server is started"))
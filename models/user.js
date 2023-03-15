const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
  },
  registerDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  refreshToken: {
    type: String,  
  },
  eventList: {
    type: [String],
    required: true,
    default: []  
  }


})

module.exports = mongoose.model("User", userSchema)
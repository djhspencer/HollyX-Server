const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  budget: {
    type: String,
    required: true,
  },
  eventDate: {
    type: String,
    required: true,
  },
  dateMade: {
    type: Date,
    required: true,
    default: Date.now
  },
  owner: {
    type: String,
    required: true,
  },
  invitedList: {
    type: [String],
    required: true,
    default: []  
  },
  participants: {
    type: [String],
    required: true,
    default: []  
  },
  declined: {
    type: [String],
    required: true,
    default: []  
  }


})

module.exports = mongoose.model("Event", eventSchema)
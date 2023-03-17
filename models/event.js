const mongoose = require('mongoose')
const User = require("./user");

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
    type: Date,
    required: true,
  },
  dateMade: {
    type: Date,
    required: true,
    default: Date.now
  },
  owner: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
  invitedList: {
    type: [String],
    required: true,
    default: []  
  },
  participants: {
    type: [mongoose.SchemaTypes.ObjectId],
    ref: "User",
    required: true,
    default: []  
  },
  declined: {
    type: [mongoose.SchemaTypes.ObjectId],
    ref: "User",
    required: true,
    default: []  
  }


})

module.exports = mongoose.model("Event", eventSchema)
require("dotenv").config();
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Event = require("../models/event");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../mailer.js");

//get all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//get all events
router.post("/getOne", authorizeUser, async (req, res) => {

  console.log(res.userInfo)

  console.log("HELLO HI")
  try {
    const eventt = await Event.find({ _id: req.body._id});
    console.log(eventt)
    res.json([eventt, res.userInfo.email]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/sendInvites", authorizeUser, async (req, res) => {

  console.log("Invitess")
  console.log(req.body.invites)
  console.log(res.userInfo)
  const eventId = req.body._id
  console.log(eventId)

  try {
    let userEmail = res.userInfo.email;
    const eventt = await Event.findOne({ _id: eventId});
    if (eventt == null) {
      return res.status(404).json({ message: "Event Not Found" });
    }

    if (userEmail) {
      const user = await User.findOne({ email: userEmail });
      if (user == null) {
        return res.status(404).json({ message: "Not valid" });
      }
    }

    const emails = req.body.invites.map((item) => {
      return item.email
    })

    console.log("GOT THIS FAR")

    eventt.invitedList.push(...emails)
    await eventt.save()

    let eventLink = `http://127.0.0.1:5173/event/${eventId}`
    console.log(eventt)
    

    for (let emailAddress of emails) {
      sendMail(emailAddress, eventLink)
    }

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//create an event
//Create one
router.post("/create", authorizeUser, async (req, res) => {


  console.log("AFTER NEXT")
  console.log(res.userInfo)

  try {
    let userEmail = res.userInfo.email;
    let eventt;

    if (userEmail) {
      const user = await User.findOne({ email: userEmail });
      if (user == null) {
        return res.status(404).json({ message: "Not valid" });
      }

      eventt = new Event({
        name: req.body.name,
        address: req.body.address,
        budget: req.body.budget,
        eventDate: req.body.eventDate,
        owner: user.email,
        participants: [user.email],
        invitedList: [user.email]
      });

      const dup = null;
      //const dup = await User.exists({ email: req.body.email})
      if (!dup) {
        const newEvent = await eventt.save();
        const newList = user.eventList
        newList.push(newEvent.id)
        user.eventList = newList
        await user.save();
        res.status(201).json(newEvent); //successfully created new event
      } else {
        return res.status(409).json({ message: "Event already exists" });
      }
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/rsvp", authorizeUser, async (req, res) => {

  const rsvp = req.body.value
  const eventId = req.body.eventId

  console.log("AFTER NEXT")
  console.log(eventId)

  try {
    let userEmail = res.userInfo.email;
    const eventt = await Event.findOne({ _id: eventId});
    if (eventt == null) {
      return res.status(404).json({ message: "Event Not Found" });
    }
    console.log(eventt)
    const user = await User.findOne({ email: userEmail });
    if (!user.eventList.includes(eventId)) {
      user.eventList.push(eventId)
      await user.save()
    }
    

    if (rsvp == "1") { // YES to event
      if (eventt.declined.includes(userEmail)) {
        const newList = eventt.declined.filter((name) => {
          return name !== userEmail;
        });
        eventt.declined = newList;
        await eventt.save()
      }
      if (!(eventt.participants.includes(userEmail))) {
        eventt.participants.push(userEmail);
        await eventt.save()
      }
      res.status(200).json({ message: "Event Sucessfully Joined" });
    } else { // NO to event
      if (eventt.participants.includes(userEmail)) {

        const newList = eventt.participants.filter((e) => {
          return e !== userEmail;
        });

        eventt.participants = newList;
        await eventt.save()
      }
      if (!(eventt.declined.includes(userEmail))) {
        eventt.declined.push(userEmail);
        await eventt.save()
        
      }
      res.status(200).json({ message: "Event Sucessfully Declined" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/userEvents", authorizeUser, async (req, res) => {

  let userEmail = res.userInfo.email;

  try {

    if (userEmail) {
      const user = await User.findOne({ email: userEmail });
      if (user == null) {
        return res.status(404).json({ message: "Not valid" });
      }

      //const userEventsList = user.eventList
      const eventss = await Event.find({
        _id: { $in: user.eventList },
      });
      res.status(200).json(eventss);
    }
  } catch (err) {
    console.log("errrrr");
    res.status(500).json({ message: err.message });
  }
});

async function authorizeUser(req, res, next) {

  const authHeader = req.headers.authorization || req.headers.Authorization;
  console.log(authHeader);

  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
  const accessToken = authHeader.split(" ")[1];
  console.log(accessToken);

  try {
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "invalid token" }); //invalid token
      console.log("Got past 403");
      console.log(decoded.UserInfo.email);
      res.userInfo = decoded.UserInfo
      next()
    });
  } catch (err) {
    console.log("Error");
    res.status(500).json({ message: err.message });
  }
}

module.exports = router;

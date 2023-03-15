require("dotenv").config();
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//get all users
router.get("/", async (req, res) => {
  console.log(req.headers.authorization);
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/auth", authorizeUser, async (req, res) => {
  console.log(res.userInfo)
  res.json({ message: "logged in" });
});

//Create one
router.post("/register", async (req, res) => {
  if (req.body.email == null || req.body.password == null) {
    return res.status(400).json({ message: "Username and password required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    const dup = await User.exists({ email: req.body.email });
    if (!dup) {

      const refreshToken = jwt.sign(
        { email: user.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      user.refreshToken = refreshToken;

      await user.save();
      //res.status(201).json(newUser); //successfully created new user

      const accessToken = jwt.sign(
        {
          UserInfo: {
            email: user.email,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15s" }
      );

      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ accessToken });

    } else {
      return res.status(409).json({ message: "Email already taken" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  if (req.body.email == null || req.body.password == null) {
    return res.status(400).json({ message: "Username and password required." });
  }

  const user = await User.findOne({ email: req.body.email });
  if (user == null) {
    return res.status(404).json({ message: "no user found" });
  }

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = jwt.sign(
        {
          UserInfo: {
            email: user.email,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15s" }
      );
      const refreshToken = jwt.sign(
        { email: user.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      user.refreshToken = refreshToken;
      const refreshedUser = await user.save();
      console.log(refreshedUser);

      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ accessToken });
    } else {
      res.status(400).json({ message: "wrong password buddy" });
    }
  } catch {
    res.status(400).json({ message: err.message });
  }
});

router.get("/refresh", async (req, res) => {
  console.log("REFRESHED");

  console.log(req.cookies);
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  const user = await User.findOne({ refreshToken: refreshToken });
  if (user == null) {
    return res.status(404).json({ message: "Not valid" });
  }

  try {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err || user.email !== decoded.email)
          //invalid token or the content doesnt match
          return res.sendStatus(403);
        const accessToken = jwt.sign(
          {
            UserInfo: {
              email: decoded.email,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15s" }
        );
        res.status(200).json({ accessToken });
      }
    );
  } catch (err) {
    console.log("errrrr");
    res.status(500).json({ message: err.message });
  }
});

router.post("/logout", async (req, res) => {
  console.log(req.cookies);
  console.log("LOGGIN OUT")
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  const user = await User.findOne({ refreshToken: refreshToken });
  if (user == null) {
    return res.status(404).json({ message: "Not valid" });
  }

  try {
    user.refreshToken = null;
    await user.save();
    res.status(200).json({ message: "Successfully logged out" });
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

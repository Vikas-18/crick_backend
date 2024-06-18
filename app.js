const express = require("express");
const app = express();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();
const port = 5000 || process.env.PORT;

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase limit for JSON
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Increase limit for URL-encoded data

const nodemailer_password = process.env.NODEMAILER_PASSWORD;
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // e.g., 'smtp.gmail.com'
  port: 465,
  secure: true,
  auth: {
    user: "hostelchatbot544@gmail.com",
    pass: nodemailer_password,
  },
});

const mongodbUrl = process.env.MONGODB_URL;
mongoose
  .connect(mongodbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB", error);
  });

const UserSchema = new mongoose.Schema({
  name: String,
  dob: String, // Store dob as String
  email: String,
  password: String,
  image: String, // Store image as Base64 string
  matches: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  centuries: { type: Number, default: 0 },
  halfCenturies: { type: Number, default: 0 },
  highestScore: { type: Number, default: 0 },
  bestBowling: { type: String, default: "0-0" },
  sixes: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  catches: { type: Number, default: 0 },
});

const User = mongoose.model("User", UserSchema);

app.post("/signup", async (req, res) => {
  const { name, dob, email, password, image } = req.body;
  const user = new User({ name, dob, email, password, image });

  const userpassword = await User.findOne({ password });
  if (userpassword) {
    return res.status(400).json({ msg: "Password Exist" });
  }
  const useremail = await User.findOne({ email });
  if (useremail) {
    return res.status(400).json({ msg: "Email exist" });
  }
  // Save the user to MongoDB
  user.save().then(() => {
    // Send email to user
    const mailOptions = {
      from: "hostelchatbot544@gmail.com",
      to: email,
      subject: "Registration Confirmation",
      text: `Congratulations! You have successfully registered, Here is your Password:${password} `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.json({
      success: true,
      message: "User created successfully.",
    });
  });
});

//POST api for login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email and password
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // If credentials are valid, return the user's profile
    res.json({
      msg: "Login successful",
      user: {
        name: user.name,
        dob: user.dob,
        image: user.image,
        matches: user.matches,
        runs: user.runs,
        wickets: user.wickets,
        centuries: user.centuries,
        halfCenturies: user.halfCenturies,
        highestScore: user.highestScore,
        bestBowling: user.bestBowling,
        sixes: user.sixes,
        fours: user.fours,
        catches: user.catches,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// update POST api

app.post("/updatestats", async (req, res) => {
  const {
    password,
    matches,
    runs,
    wickets,
    centuries,
    halfCenturies,
    highestScore,
    bestBowling,
    sixes,
    fours,
    catches,
  } = req.body;

  try {
    // Find the user by password
    const user = await User.findOne({ password });

    if (!user) {
      return res
        .status(404)
        .json({ msg: "User not found or incorrect password" });
    }

    // Update the stats if they are provided
    if (matches !== undefined) user.matches += matches;
    if (runs !== undefined) user.runs += runs;
    if (wickets !== undefined) user.wickets += wickets;
    if (centuries !== undefined) user.centuries += centuries;
    if (halfCenturies !== undefined) user.halfCenturies += halfCenturies;
    if (highestScore !== undefined)
      user.highestScore = Math.max(user.highestScore, highestScore);
    if (bestBowling !== undefined) user.bestBowling = bestBowling; // Add comparison logic if needed
    if (sixes !== undefined) user.sixes += sixes;
    if (fours !== undefined) user.fours += fours;
    if (catches !== undefined) user.catches += catches;

    // Save the updated user back to the database
    await user.save();

    res.json({
      success: true,
      message: "Stats updated successfully.",
      user,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Existing code...

//for all the profiles GET api
app.get("/profile", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

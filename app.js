const express = require("express");
const app = express();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const multer = require("multer");
require("dotenv").config();
const cors = require("cors");

const port = 5000;
const nodemailerpassword = "wqtnfhhjkyqymytx";
const mongodbUrl = process.env.MONGODB_URL;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "hostelchatbot544@gmail.com",
    pass: nodemailerpassword,
  },
});

app.use(cors());
app.use(express.json());

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../src/images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  dob: {
    type: Date, // Change to Date type
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/.+\@.+\..+/, "Please fill a valid email address"],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  image: {
    type: String,
    required: false,
  },
});

const User = mongoose.model("User", UserSchema);

app.post("/signup", upload.single("image"), (req, res) => {
  const { name, dob, email, password } = req.body;
  const image = req.file ? req.file.path : null;

  // Parse dob string from dd-mm-yyyy format to Date object
  const [day, month, year] = dob.split("-");
  const dobDate = new Date(`${year}-${month}-${day}`);

  const user = new User({ name, dob: dobDate, email, password, image });

  user
    .save()
    .then(() => {
      const mailOptions = {
        from: "hostelchatbot544@gmail.com",
        to: email,
        subject: "Registration Confirmation",
        text: `Congratulations! You have successfully registered. Here is your password: ${password}`,
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
    })
    .catch((error) => {
      res.status(500).json({ success: false, error: error.message });
    });
});

app.get("/profile", async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, users: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server connected on port ${port}`);
});

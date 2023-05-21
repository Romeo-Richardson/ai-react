const express = require("express");
const mongoose = require("mongoose");
const gtts = require("node-gtts")("en");
const path = require("path");
require("dotenv").config();
const app = express();
app.use(express.json());
const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

const historyModel = require("./models/history");

mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb+srv://ZirrKing:65937675299041230290728123677583@cluster0.5r4pdz7.mongodb.net/aigod?retryWrites=true&w=majority"
);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/ai-react/build")));

  app.get("/getHistory", async (req, res) => {
    const history = await historyModel.find();
    res.json(history);
  });

  app.get("/speech", function (req, res) {
    res.set({ "Content-Type": "audio/mpeg" });
    gtts.stream(req.query.text).pipe(res);
  });

  app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "ai-react", "build", "index.html"));
  });
} else
  app.get("/", (req, res) => {
    res.send("api running");
  });

app.post("/postUser", async (req, res) => {
  const user = req.body;
  const newUser = new historyModel(user);
  await newUser.save();
  res.json(newUser);
});

app.put("/postHistory", async (req, res) => {
  const id = req.body._id;
  const newHistory = req.body.history;
  try {
    const getHistory = await historyModel.findById(id);
    console.log(getHistory);
    getHistory.history = newHistory;
    await getHistory.save();
    res.status(200).json(getHistory);
  } catch (error) {
    console.log(error);
    console.log(req.body);
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`server running on port ${process.env.PORT}`);
});

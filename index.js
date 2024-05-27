require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { MONGO_DB_CONFIG } = require("./config/app.config");
const http = require("http");
const server = http.createServer(app);
const { initMeetingServer } = require("./meetingServer");

// meeting-server
initMeetingServer(server);

mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    () => {
      console.log("Database connected");
    },
    (error) => {
      console.log("database connection error", error);
    }
  );

app.use(express.json());
app.use("/api", require("./routes/app.routes"));

server.listen(process.env.PORT || 4003, function () {
  console.log("Meeting server is ready to go");
});

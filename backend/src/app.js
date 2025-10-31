require("dotenv").config();

const express = require("express");
const app = express();

const { createServer } = require("node:http");
const { Server } = require("socket.io");
const server = createServer(app);

const { connectToSocket } = require("./controllers/socketManager");
const io = connectToSocket(server);

const mongoose = require("mongoose");
const cors = require("cors");

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

const userRoutes = require("./routes/users.routes")

app.use("/api/v1/users", userRoutes);

app.get("/", (req, res) => {
  return res.send("Hi, I am Root");
});

app.set("PORT", process.env.PORT || 8080);
app.set("url", process.env.MONGO_URL);

// Connect to database first, then start server
const startServer = async () => {
  try {
    await mongoose.connect(app.get("url"));
    console.log("✅ MongoDB connected successfully");
    
    server.listen(app.get("PORT"), () => {
      console.log(`✅ Server is listening on port ${app.get("PORT")}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Handle MongoDB connection errors
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed through app termination");
  process.exit(0);
});

startServer();

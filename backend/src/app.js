require("dotenv").config();

const express = require("express");
const app = express();

const mongoose = require("mongoose");
const cors = require("cors");

// CORS configuration for production and development
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://neosetu.vercel.app',
    'https://neosetu-b.vercel.app',
    'https://neosetu-qcv5.onrender.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

const userRoutes = require("./routes/users.routes");
app.use("/api/v1/users", userRoutes);

app.get("/", (req, res) => {
  return res.send("Hi, I am Root");
});

// Export app for serverless handlers (Vercel) or for custom server startup
app.set("PORT", process.env.PORT || 8080);
app.set("url", process.env.MONGO_URL);

// Helper to connect to MongoDB (used by server start or serverless functions)
const connectToDb = async () => {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(app.get("url"));
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }
};

// If this file is run directly (node src/app.js), start an HTTP server and socket manager
if (require.main === module) {
  const { createServer } = require("node:http");
  const server = createServer(app);
  const { connectToSocket } = require("./controllers/socketManager");
  // Socket.io requires a persistent server — only start when running a real server
  connectToSocket(server);

  (async () => {
    try {
      await connectToDb();
      server.listen(app.get("PORT"), () => {
        console.log(`✅ Server is listening on port ${app.get("PORT")}`);
      });
    } catch (e) {
      console.error("Failed to start server:", e.message);
      process.exit(1);
    }
  })();
}

module.exports = { app, connectToDb };

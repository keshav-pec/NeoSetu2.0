const serverless = require("serverless-http");
const { app, connectToDb } = require("./app");

const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    await connectToDb();
  } catch (e) {
    console.error("DB connect error in serverless handler:", e.message);
    res.statusCode = 500;
    return res.end("Database connection error");
  }

  return handler(req, res);
};

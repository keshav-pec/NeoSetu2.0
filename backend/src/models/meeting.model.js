const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const meetingSchema = new Schema({
  user_id: { type: String, required: true },
  meetingCode: { type: String, required: true },
  date: { type: Date, default: Date.now, required: true },
});

// Add index for faster queries
meetingSchema.index({ user_id: 1, date: -1 });

const Meeting = mongoose.model("meeting", meetingSchema);

module.exports = { Meeting };

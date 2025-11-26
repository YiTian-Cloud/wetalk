// models/User.js
/*
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
*/

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },       // display name
    email: { type: String, index: true },             // Cognito email
    cognitoSub: { type: String, index: true },        // Cognito user id (sub)
    passwordHash: String,                             // legacy only; not used for Cognito
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 16 },
    passwordHash: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 16 },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;
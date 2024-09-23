const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },  // Unique tag name
    description: { type: String }  // Optional description for the tag
});

const Tag = mongoose.model('Tag', TagSchema);

module.exports = Tag;
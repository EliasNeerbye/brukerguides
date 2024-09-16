const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Define the schema for "content" within each part (paragraphs or images)
const ContentSchema = new Schema({
  type: { type: String, enum: ['p', 'img'], required: true },  // Either paragraph or image
  value: { type: String, required: true },  // Text for paragraphs or image URL for img
  alt: { type: String }, // Optional alt text for images
  id: { type: String } // Custom ID for paragraph or image
});

// Define the schema for each "part" (section with h2 and content)
const PartSchema = new Schema({
  heading: { type: String, required: true },  // The <h2> text
  content: [ContentSchema]  // Array of content (paragraphs and images)
});

// Define the main "Guide" schema
const GuideSchema = new Schema({
  title: { type: String, required: true },  // The <h1> of the guide
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],  // Array of references to Tag model
  parts: [PartSchema],  // Array of parts (sections)
  dateCreated: { type: Date, default: Date.now },  // Creation date
  dateUpdated: { type: Date, default: Date.now }  // Last update date
});

// Automatically update the `dateUpdated` field when a document is updated
GuideSchema.pre('save', function (next) {
  this.dateUpdated = Date.now();
  next();
});

const Guide = mongoose.model('Guide', GuideSchema);

module.exports = Guide;

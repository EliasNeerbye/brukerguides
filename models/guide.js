const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Define the schema for "content" within each part (paragraphs or images)
const ContentSchema = new Schema({
  type: { type: String, enum: ['p', 'img'], required: true },
  value: { type: String, required: true },
  alt: { type: String }, // Optional for images
  id: { type: String } // Optional
});


// Define the schema for each "part" (section with h2 and content)
const PartSchema = new Schema({
  heading: { type: String, required: true },
  content: [ContentSchema]
});


// Define the main "Guide" schema
const GuideSchema = new Schema({
  title: { type: String, required: true },
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  parts: [PartSchema],
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now }
});

GuideSchema.pre('save', function (next) {
  this.dateUpdated = Date.now();
  next();
});

const Guide = mongoose.model('Guide', GuideSchema);

module.exports = Guide;

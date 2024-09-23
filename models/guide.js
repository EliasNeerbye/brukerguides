const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  header: { type: String, required: true },
  paragraphs: [{
    text: { type: String, required: true },
    id: { type: String, required: false },
    pIndex: { type: Number, required: true }
  }],
  images: [{
    url: { type: String, required: true },
    filename: { type: String, required: true },
    imgIndex: { type: Number, required: true }
  }],
  index: { type: Number, required: true }
});

const GuideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sections: [SectionSchema],
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }]
}, { timestamps: true });

const Guide = mongoose.model('Guide', GuideSchema);

module.exports = Guide;
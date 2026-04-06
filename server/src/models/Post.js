const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const commentSchema = new mongoose.Schema({
  user:       { type: ObjectId, ref: 'User', required: true },
  foundation: { type: ObjectId, ref: 'Foundation' },
  text:       { type: String, required: true, trim: true },
  createdAt:  { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  body:       { type: String, required: true },
  type:       { type: String, enum: ['elon', 'yangilik', 'musobaqa'], default: 'elon' },
  image:      { type: String }, // Cloudinary URL (optional)
  foundation: { type: ObjectId, ref: 'Foundation', required: true },
  author:     { type: ObjectId, ref: 'User', required: true },
  likes:      [{ type: ObjectId, ref: 'User' }],
  comments:   [commentSchema],
  views:      { type: Number, default: 0 },
}, { timestamps: true });

postSchema.index({ createdAt: -1 });
postSchema.index({ type: 1 });

module.exports = mongoose.model('Post', postSchema);

const mongoose = require('mongoose');

const foundationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  email: { type: String, lowercase: true },
  address: { type: String },
  logo: { type: String },
  telegramChatId: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Foundation', foundationSchema);

const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  status: { type: String },
  comment: { type: String },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByFoundation: { type: mongoose.Schema.Types.ObjectId, ref: 'Foundation' },
  changedAt: { type: Date, default: Date.now },
}, { _id: false });

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  address: { type: String, trim: true },
  region: { type: String },
  district: { type: String },
  phone: { type: String, trim: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  deadline: { type: Date },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open',
  },
  beneficiary: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByFoundation: { type: mongoose.Schema.Types.ObjectId, ref: 'Foundation' },
  history: [historySchema],
}, { timestamps: true });

noticeSchema.index({ status: 1 });
noticeSchema.index({ region: 1 });
noticeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);

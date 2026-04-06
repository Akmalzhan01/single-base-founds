const mongoose = require('mongoose');

const aidRecordSchema = new mongoose.Schema({
  beneficiary: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary', required: true },
  foundation: { type: mongoose.Schema.Types.ObjectId, ref: 'Foundation' },
  aidType: {
    type: String,
    enum: ['Азык-түүлүк', 'Дары-дармек', 'Акча', 'Кийим', 'Мэбел', 'Башка'],
    required: true,
  },
  amount: { type: Number },
  description: { type: String, required: true },
  givenAt: { type: Date, default: Date.now },
  givenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  photo: { type: String },
}, { timestamps: true });

aidRecordSchema.index({ beneficiary: 1 });
aidRecordSchema.index({ foundation: 1 });
aidRecordSchema.index({ givenAt: -1 });

module.exports = mongoose.model('AidRecord', aidRecordSchema);

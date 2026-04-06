const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  foundation: { type: mongoose.Schema.Types.ObjectId, ref: 'Foundation' },
  action: { type: String, required: true },   // 'create' | 'update' | 'delete' | 'status_change' | 'login'
  entity: { type: String },                   // 'Beneficiary' | 'Notice' | 'AidRecord' | 'User'
  entityId: { type: String },
  description: { type: String },
  changes: { type: mongoose.Schema.Types.Mixed }, // [{ field, from, to }]
  ip: { type: String },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ entity: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

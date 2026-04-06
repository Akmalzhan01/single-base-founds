const AuditLog = require('../models/AuditLog');

/**
 * Log an action to the audit trail (fire-and-forget, never throws)
 * @param {Object} req - Express request (for user, foundation, ip)
 * @param {Object} opts - { action, entity, entityId, description }
 */
const audit = (req, { action, entity, entityId, description, changes }) => {
  try {
    AuditLog.create({
      user: req.user?._id,
      foundation: req.foundation?._id,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      description,
      changes: changes && changes.length ? changes : undefined,
      ip: req.ip,
    }).catch(() => {});
  } catch {}
};

module.exports = audit;

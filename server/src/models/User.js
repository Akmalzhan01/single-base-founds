const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  foundation: { type: mongoose.Schema.Types.ObjectId, ref: 'Foundation' },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['fond_admin', 'fond_staff'],
    default: 'fond_staff',
  },
  isSuperadmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.correctPassword = async function (candidate, hashed) {
  return bcrypt.compare(candidate, hashed);
};

module.exports = mongoose.model('User', userSchema);

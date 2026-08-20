require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

// Usage:
//   node scripts/reset-superadmin.js              -> list superadmins, test default password
//   node scripts/reset-superadmin.js <newPassword> -> reset superadmin password
//   node scripts/reset-superadmin.js <newPassword> <phone> -> reset a specific account

const [newPassword, phone] = process.argv.slice(2);

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const filter = phone ? { phone } : { isSuperadmin: true };
  const users = await User.find(filter).select('+password');

  if (!users.length) {
    console.log('Superadmin табылган жок (no superadmin found).');
    console.log('Run: npm run seed');
    process.exit(1);
  }

  if (!newPassword) {
    console.log(`Found ${users.length} account(s):\n`);
    for (const u of users) {
      const isDefault = await bcrypt.compare('admin123', u.password);
      console.log(`  name:     ${u.name}`);
      console.log(`  phone:    ${u.phone}`);
      console.log(`  active:   ${u.isActive}`);
      console.log(`  password: ${isDefault ? '"admin123" (default)' : 'changed — reset it'}\n`);
    }
    console.log('To reset: node scripts/reset-superadmin.js <newPassword>');
    process.exit(0);
  }

  if (newPassword.length < 6) {
    console.log('Password must be at least 6 characters.');
    process.exit(1);
  }

  for (const u of users) {
    u.password = newPassword;
    u.isActive = true;
    await u.save();
    console.log(`Password reset: ${u.phone} / ${newPassword}`);
  }

  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Foundation = require('../src/models/Foundation');
const User = require('../src/models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Superadmin
  const existingSuperadmin = await User.findOne({ isSuperadmin: true });
  if (!existingSuperadmin) {
    await User.create({
      name: 'Superadmin',
      phone: '+996700000000',
      password: 'admin123',
      isSuperadmin: true,
      role: 'fond_admin',
      isActive: true,
    });
    console.log('Superadmin created: +996700000000 / admin123');
  } else {
    console.log('Superadmin already exists');
  }

  // Karavan Ihlas fond
  let foundation = await Foundation.findOne({ slug: 'karavan-ihlas' });
  if (!foundation) {
    foundation = await Foundation.create({
      name: 'Karavan Ihlas',
      slug: 'karavan-ihlas',
      phone: '+996555000000',
      isActive: true,
    });
    console.log('Foundation created: Karavan Ihlas');
  }

  // Fond admin
  const existingAdmin = await User.findOne({ phone: '+996555111111' });
  if (!existingAdmin) {
    await User.create({
      name: 'Fond Admin',
      phone: '+996555111111',
      password: 'fond123',
      role: 'fond_admin',
      foundation: foundation._id,
      isActive: true,
    });
    console.log('Fond admin created: +996555111111 / fond123');
  }

  console.log('\nSeed complete!');
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });

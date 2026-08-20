require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// needType бир мааниден массивге өттү.
// Эски жазуулар string болуп сакталган — Mongoose аларды окуганда автоматтык
// түрдө массивге айлантат, ошондуктан бул миграция МИЛДЕТТҮҮ ЭМЕС.
// Базадагы маалыматты бир калыпка келтирүү үчүн гана керек.
//
// Usage:
//   node scripts/migrate-needtype.js          -> канча жазуу тиешелүү экенин көрсөтөт
//   node scripts/migrate-needtype.js --apply  -> чындап өзгөртөт

const apply = process.argv.includes('--apply');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.db.collection('beneficiaries');

  const docs = await col.find({ needType: { $type: 'string' } }, { projection: { needType: 1 } }).toArray();
  console.log(`String болуп жаткан жазуулар: ${docs.length}`);

  if (!docs.length) {
    console.log('Баары массив — миграция кереги жок.');
    process.exit(0);
  }

  if (!apply) {
    console.log('\nСыноо режими. Чындап өзгөртүү үчүн: node scripts/migrate-needtype.js --apply');
    process.exit(0);
  }

  let updated = 0;
  for (const d of docs) {
    await col.updateOne({ _id: d._id }, { $set: { needType: [d.needType] } });
    updated++;
  }

  console.log(`Өзгөртүлдү: ${updated}`);
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });

const mongoose = require('mongoose');

const VERIFICATION_STATUSES = ['Текшерилбеген', 'Текшерүүдө', 'Текшерилген', 'Шектүү', 'Аферист'];

const childSchema = new mongoose.Schema({
  inn: { type: String },
  fullName: { type: String },
  birthDate: { type: Date },
  clothingSize: { type: String },
  shoeSize: { type: String },
}, { _id: false });

const spouseSchema = new mongoose.Schema({
  relation: { type: String, enum: ['Күйөөсу', 'Аялы'] },
  inn: { type: String },
  fullName: { type: String },
  birthDate: { type: Date },
  phone: { type: String },
  employed: { type: Boolean },
  clothingSize: { type: String },
  shoeSize: { type: String },
}, { _id: false });

const beneficiarySchema = new mongoose.Schema({
  // Муктаж тууралуу маалымат
  inn: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  birthDate: { type: Date },
  address: { type: String },
  phone: { type: String },
  // status, needType, guardianType, supportSources — маанилери Category коллекциясынан
  // (суперадмин башкарат), текшерүү контроллерде: services/categoryService.js
  status: { type: String },
  // Текшерүү абалы — фонддор муктажды текшергенден кийин белгилейт
  verificationStatus: {
    type: String,
    enum: VERIFICATION_STATUSES,
    default: 'Текшерилбеген',
  },
  // Бир нече муктаздык тандалышы мүмкүн
  needType: { type: [String], default: () => [] },
  childrenCount: { type: Number, default: 0 },
  guardianType: { type: String },
  employed: { type: Boolean },

  // Ким жардам берет — бир нече булак болушу мүмкүн
  supportSources: { type: [String], default: () => [] },
  // Орточо айлык киреше (сом)
  monthlyIncome: { type: Number, min: 0 },

  photo: { type: String },
  comments: { type: String },
  clothingSize: { type: String },
  shoeSize: { type: String },

  // Үй-бүлөсү тууралуу маалымат
  spouse: { type: spouseSchema },

  // Балдары тууралуу маалымат
  children: [childSchema],

  // Худуд
  region: { type: String },
  district: { type: String },
  village: { type: String },

  // Koordinatalar (xaritada pin)
  lat: { type: Number },
  lng: { type: Number },

  // Meta
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Foundation' },
  registeredByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

beneficiarySchema.index({ phone: 1 });
beneficiarySchema.index({ fullName: 'text' });
beneficiarySchema.index({ region: 1, district: 1 });
beneficiarySchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
module.exports.VERIFICATION_STATUSES = VERIFICATION_STATUSES;

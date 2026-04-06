const mongoose = require('mongoose');

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
  status: {
    type: String,
    enum: ['Карыя', 'Жесир', 'Майып', 'Зейнеткер', 'Жалгыз эне', 'Башка'],
    default: 'Карыя',
  },
  needType: {
    type: String,
    enum: ['Азык-түүлүк', 'Дары-дармек', 'Акча', 'Кийим', 'Мэбел', 'Башка'],
    default: 'Азык-түүлүк',
  },
  childrenCount: { type: Number, default: 0 },
  guardianType: {
    type: String,
    enum: ['Жалгыз', 'Эри', 'Аялы', 'Балдары', 'Башка'],
  },
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

module.exports = mongoose.model('Beneficiary', beneficiarySchema);

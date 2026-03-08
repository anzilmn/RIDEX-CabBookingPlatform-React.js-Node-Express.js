const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: [true, 'Name is required'], trim: true, minlength: [2,'Name too short'] },
  email:    { type: String, required: [true,'Email is required'], unique: true, lowercase: true,
              match: [/^[\w.-]+@[\w.-]+\.\w+$/, 'Invalid email format'] },
  password: { type: String, required: [true,'Password is required'], minlength: [6,'Min 6 chars'] },
  phone:    { type: String, required: [true,'Phone is required'], unique: true,
              match: [/^[0-9]{10,15}$/, 'Invalid phone number'] },
  role:     { type: String, enum: ['rider','driver','admin'], default: 'rider' },
  avatar:   { type: String, default: '' },
  isVerified:   { type: Boolean, default: false },
  isBlocked:    { type: Boolean, default: false },
  blockReason:  { type: String, default: '' },       // why they were blocked
  blockedUntil: { type: Date, default: null },        // null = permanent, Date = auto-unblock at this time
  resetPasswordToken:  String,
  resetPasswordExpire: Date,
  verificationToken:   String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = async function(pwd) {
  return bcrypt.compare(pwd, this.password);
};
module.exports = mongoose.model('User', userSchema);

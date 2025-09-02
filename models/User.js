const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  phone:    { type: String },
  gender:   { type: String, enum: ['Male','Female','Other'], default: 'Other' },
  dob:      { type: Date },
  address:  { type: String },
  role:     { type: String, enum: ['user','admin'], default: 'user' },
  createdAt:{ type: Date, default: Date.now }
});

// Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);

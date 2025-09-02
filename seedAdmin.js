require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.env.ADMIN_EMAIL;
    const exists = await User.findOne({ email });
    if (exists) {
      console.log('Admin already exists:', email);
      process.exit(0);
    }
    const admin = new User({
      fullName: process.env.ADMIN_NAME || 'Admin',
      email,
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user created:', email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// helpers
function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}
function isStrongPassword(pw) {
  return /(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])/.test(pw);
}

// Register
router.get('/register', (req, res) => res.render('register', { error: null }));
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone, gender, dob, address } = req.body;
    if (!fullName || !email || !password) return res.render('register', { error: 'Name, email and password required.' });
    if (!validateEmail(email)) return res.render('register', { error: 'Invalid email.' });
    if (!isStrongPassword(password)) return res.render('register', { error: 'Password too weak.' });

    const exists = await User.findOne({ email });
    if (exists) return res.render('register', { error: 'Email already in use.' });

    const user = new User({ fullName, email, password, phone, gender, dob, address });
    await user.save();
    res.redirect('/login?registered=1');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Server error.' });
  }
});

// Login
router.get('/login', (req, res) => {
  const registered = req.query.registered || null;
  res.render('login', { error: null, registered });
});

// Login POST
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.render('login', { error: 'Invalid credentials.', registered: null });

    const ok = await user.comparePassword(password);
    if (!ok) return res.render('login', { error: 'Invalid credentials.', registered: null });

    // Save session
    req.session.user = { id: user._id, fullName: user.fullName, email: user.email, role: user.role };

    // Redirect by role
    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Server error.', registered: null });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;

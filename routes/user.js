const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
router.get('/profile', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.user.id).lean();
  res.render('profile', { user });
});

// Edit Profile (form page)
router.get('/profile/edit', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id); // no .lean()

    res.render('edit-profile', {
      user,
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null
    });

    // clear messages after showing once
    req.session.successMessage = null;
    req.session.errorMessage = null;
  } catch (error) {
    console.error(error);
    res.redirect('/profile'); // fallback in case of error
  }
});


// Handle Profile Update
router.post('/profile/edit', requireAuth, async (req, res) => {
  const { fullName, phone, gender, dob, address } = req.body;

  await User.findByIdAndUpdate(req.session.user.id, {
    fullName,
    phone,
    gender,
    dob,
    address
  });

  res.redirect('/profile'); // ✅ back to profile page
});
router.get('/profile/change-password', requireAuth, (req, res) => {
  res.render('change-password', {
    successMessage: req.session.successMessage || null,
    errorMessage: req.session.errorMessage || null
  });

  req.session.successMessage = null;
  req.session.errorMessage = null;
});

// Handle Change Password
router.post('/profile/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findById(req.session.user.id);

    // 1️⃣ check old password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      req.session.errorMessage = 'Current password is incorrect.';
      return res.redirect('/profile/change-password');
    }

    // 2️⃣ check confirm
    if (newPassword !== confirmPassword) {
      req.session.errorMessage = 'New password and confirm password do not match.';
      return res.redirect('/profile/change-password');
    }

    // 3️⃣ update + hash (trigger pre-save hook)
    user.password = newPassword;
    await user.save();

    req.session.successMessage = 'Password changed successfully ✅';
    res.redirect('/profile/change-password');
  } catch (err) {
    console.error(err);
    req.session.errorMessage = 'Something went wrong. Try again.';
    res.redirect('/profile/change-password');
  }
});



module.exports = router;

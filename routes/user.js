const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.get('/profile', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.user.id).lean();
  res.render('profile', { user });
});


router.get('/profile/edit', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id); // no .lean()

    res.render('edit-profile', {
      user,
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null
    });

    
    req.session.successMessage = null;
    req.session.errorMessage = null;
  } catch (error) {
    console.error(error);
    res.redirect('/profile'); 
  }
});



router.post('/profile/edit', requireAuth, async (req, res) => {
  const { fullName, phone, gender, dob, address } = req.body;

  await User.findByIdAndUpdate(req.session.user.id, {
    fullName,
    phone,
    gender,
    dob,
    address
  });

  res.redirect('/profile'); 
});
router.get('/profile/change-password', requireAuth, (req, res) => {
  res.render('change-password', {
    successMessage: req.session.successMessage || null,
    errorMessage: req.session.errorMessage || null
  });

  req.session.successMessage = null;
  req.session.errorMessage = null;
});


router.post('/profile/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findById(req.session.user.id);

   
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      req.session.errorMessage = 'Current password is incorrect.';
      return res.redirect('/profile/change-password');
    }

 
    if (newPassword !== confirmPassword) {
      req.session.errorMessage = 'New password and confirm password do not match.';
      return res.redirect('/profile/change-password');
    }

    
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

const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });
// Admin dashboard with search/filter and report data
router.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const { q, gender, from, to } = req.query;
    const filter = { role: 'user' };
    if (q) filter.fullName = { $regex: q, $options: 'i' };
    if (gender) filter.gender = gender;
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);

    const users = await User.find(filter).sort({ createdAt: -1 }).lean();
    const totalUsers = await User.countDocuments({ role: 'user' });

    const genderCount = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    const monthlyRegs = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // age groups
    const ageGroups = {  '10-17': 0,'18-25': 0, '26-35': 0, '36-50': 0, '50+': 0 };
    users.forEach(u => {
  if (!u.dob) return;
  const age = Math.floor((Date.now() - new Date(u.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  if (age >= 10 && age <= 17) ageGroups['10-17']++;
  else if (age >= 18 && age <= 25) ageGroups['18-25']++;
  else if (age <= 35) ageGroups['26-35']++;
  else if (age <= 50) ageGroups['36-50']++;
  else if (age > 50) ageGroups['50+']++;
});

    res.render('admin-dashboard', {
      users, totalUsers, genderCount, monthlyRegs, ageGroups, query: req.query
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Export CSV
router.get('/admin/export/csv', requireAdmin, async (req, res) => {
  try {
    const filter = { role: 'user' };
    const users = await User.find(filter).lean();
    const fields = ['fullName','email','phone','gender','dob','address','createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(users.map(u => ({
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || '',
      gender: u.gender || '',
      dob: u.dob ? new Date(u.dob).toISOString().slice(0,10) : '',
      address: u.address || '',
      createdAt: new Date(u.createdAt).toISOString()
    })));
    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('Export failed');
  }
});

// Export PDF (simple)
router.get('/admin/export/pdf', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).lean();
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Disposition', 'attachment; filename=users.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    doc.fontSize(18).text('Users Report', { align: 'center' });
    doc.moveDown();
    users.forEach((u, idx) => {
      doc.fontSize(10).text(`${idx+1}. ${u.fullName} | ${u.email} | ${u.phone || '-'} | ${u.gender || '-'} | DOB: ${u.dob ? new Date(u.dob).toISOString().slice(0,10) : '-'}`);
      doc.moveDown(0.2);
    });
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('PDF export failed');
  }
});

// Delete user
router.post('/admin/user/delete/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    req.session.successMessage = "User deleted successfully!";
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    req.session.errorMessage = "Failed to delete user.";
    res.redirect('/admin/dashboard');
  }
});

// View a single user profile (admin side)
router.get('/admin/user/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render('admin-user-profile', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post('/admin/import/csv', requireAdmin, upload.single('csvfile'), async (req, res) => {
  try {
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        // Map CSV data to User model
        for (const r of results) {
          // Prevent duplicate emails
          const exists = await User.findOne({ email: r.email });
          if (!exists) {
            await User.create({
              fullName: r.fullName,
              email: r.email,
              phone: r.phone || '',
              gender: r.gender || '',
              dob: r.dob ? new Date(r.dob) : null,
              address: r.address || '',
              password: 'Temp@123', // you may want to auto-assign or generate
              role: 'user'
            });
          }
        }
        fs.unlinkSync(req.file.path); // cleanup
        req.session.successMessage = "Users imported successfully!";
        res.redirect('/admin/dashboard');
      });
  } catch (err) {
    console.error(err);
    req.session.errorMessage = "Import failed.";
    res.redirect('/admin/dashboard');
  }
});
module.exports = router;

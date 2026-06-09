const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Snippet = require('../models/Snippet');
const Comment = require('../models/Comment');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalSnippets, totalComments, proUsers] = await Promise.all([
      User.countDocuments(),
      Snippet.countDocuments(),
      Comment.countDocuments(),
      User.countDocuments({ plan: 'pro' }),
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email avatar createdAt plan');

    const recentSnippets = await Snippet.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'name')
      .select('title language views createdAt');

    res.json({
      stats: { totalUsers, totalSnippets, totalComments, proUsers },
      recentUsers,
      recentSnippets,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = search
      ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
      : {};

    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id — ban user
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }
    await User.findByIdAndDelete(req.params.id);
    await Snippet.deleteMany({ author: req.params.id });
    await Comment.deleteMany({ author: req.params.id });
    res.json({ message: 'User and their content deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/role — change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
      '-password -refreshToken'
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/snippets
router.get('/snippets', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = search ? { $text: { $search: search } } : {};

    const snippets = await Snippet.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Snippet.countDocuments(query);
    res.json({ snippets, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/snippets/:id
router.delete('/snippets/:id', async (req, res) => {
  try {
    await Snippet.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ snippet: req.params.id });
    res.json({ message: 'Snippet deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Snippet = require('../models/Snippet');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../services/cloudinary');

// GET /api/users/:id — public profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken -stripeCustomerId -stripeSubscriptionId -email')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const snippets = await Snippet.find({ author: req.params.id, isPublic: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ user, snippets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile — update own profile
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('bio').optional().isLength({ max: 300 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, bio } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { ...(name && { name }), ...(bio !== undefined && { bio }) },
        { new: true }
      ).select('-password -refreshToken');
      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/users/avatar — upload avatar
router.post('/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    ).select('-password -refreshToken');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:id/follow — follow or unfollow
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      currentUser.following.pull(req.params.id);
      target.followers.pull(req.user._id);
    } else {
      currentUser.following.push(req.params.id);
      target.followers.push(req.user._id);

      Notification.create({
        recipient: target._id,
        sender: req.user._id,
        type: 'follow',
        message: `${req.user.name} started following you`,
        link: `/profile/${req.user._id}`,
      }).catch(console.error);
    }

    await Promise.all([currentUser.save(), target.save()]);

    res.json({
      following: !isFollowing,
      followerCount: target.followers.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

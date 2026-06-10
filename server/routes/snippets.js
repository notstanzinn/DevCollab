const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Snippet = require('../models/Snippet');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { sendNotificationEmail } = require('../services/email');
const User = require('../models/User');

// GET /api/snippets  — paginated public feed
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, language, search, sort = 'newest' } = req.query;
    const query = { isPublic: true };

    if (language) query.language = language;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { description: regex }, { tags: regex }];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { views: -1 },
      stars: { 'stars.length': -1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const snippets = await Snippet.find(query)
      .populate('author', 'name avatar')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Snippet.countDocuments(query);

    res.json({
      snippets,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/snippets — create snippet
router.post(
  '/',
  protect,
  [
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('code').notEmpty().withMessage('Code is required'),
    body('language').notEmpty().withMessage('Language is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, code, language, description, tags, isPublic } = req.body;
      const snippet = await Snippet.create({
        title,
        code,
        language,
        description,
        tags: tags || [],
        isPublic: isPublic !== undefined ? isPublic : true,
        author: req.user._id,
      });
      await snippet.populate('author', 'name avatar');
      res.status(201).json({ snippet });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/snippets/:id — get single snippet
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id)
      .populate('author', 'name avatar bio')
      .populate('forkedFrom', 'title author')
      .populate('collaborators', 'name avatar email');

    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });
    if (!snippet.isPublic && String(snippet.author._id) !== String(req.user?._id)) {
      return res.status(403).json({ message: 'This snippet is private' });
    }

    // Track unique account views
    if (req.user) {
      const result = await Snippet.updateOne(
        { _id: req.params.id, viewedBy: { $ne: req.user._id } },
        { $inc: { views: 1 }, $addToSet: { viewedBy: req.user._id } }
      );
      if (result.modifiedCount > 0) snippet.views = (snippet.views || 0) + 1;
    }

    res.json({ snippet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/snippets/:id — update snippet (owner: all fields | collaborator: code only)
router.put('/:id', protect, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });

    const isOwner        = String(snippet.author) === String(req.user._id);
    const isCollaborator = snippet.collaborators.some(c => String(c) === String(req.user._id));

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (isOwner) {
      // Owner can update everything
      const { title, code, language, description, tags, isPublic } = req.body;
      Object.assign(snippet, { title, code, language, description, tags, isPublic });
    } else {
      // Collaborators can only save the code
      snippet.code = req.body.code;
    }

    await snippet.save();
    await snippet.populate('author', 'name avatar');
    await snippet.populate('collaborators', 'name avatar email');
    res.json({ snippet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/snippets/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });
    if (String(snippet.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await snippet.deleteOne();
    await Comment.deleteMany({ snippet: req.params.id });
    res.json({ message: 'Snippet deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/snippets/:id/star — toggle star
router.post('/:id/star', protect, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id).populate('author', 'name email');
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });

    const userId        = req.user._id;
    const alreadyStarred = snippet.stars.includes(userId);

    if (alreadyStarred) {
      snippet.stars.pull(userId);
    } else {
      snippet.stars.push(userId);
      if (String(snippet.author._id) !== String(userId)) {
        Notification.create({
          recipient: snippet.author._id,
          sender: userId,
          type: 'star',
          message: `${req.user.name} starred your snippet "${snippet.title}"`,
          link: `/snippets/${snippet._id}`,
        }).catch(console.error);
      }
    }

    await snippet.save();
    res.json({ stars: snippet.stars.length, starred: !alreadyStarred });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/snippets/:id/fork — fork snippet
router.post('/:id/fork', protect, async (req, res) => {
  try {
    const original = await Snippet.findById(req.params.id).populate('author', 'name email');
    if (!original) return res.status(404).json({ message: 'Snippet not found' });

    const forked = await Snippet.create({
      title: `Fork of ${original.title}`,
      code: original.code,
      language: original.language,
      description: original.description,
      tags: original.tags,
      author: req.user._id,
      forkedFrom: original._id,
      isPublic: true,
    });

    original.forks.push(forked._id);
    await original.save();

    if (String(original.author._id) !== String(req.user._id)) {
      Notification.create({
        recipient: original.author._id,
        sender: req.user._id,
        type: 'fork',
        message: `${req.user.name} forked your snippet "${original.title}"`,
        link: `/snippets/${forked._id}`,
      }).catch(console.error);
    }

    await forked.populate('author', 'name avatar');
    res.status(201).json({ snippet: forked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// COLLABORATOR ROUTES
// ─────────────────────────────────────────────────────────

// POST /api/snippets/:id/collaborators — owner adds a collaborator by email or username
router.post('/:id/collaborators', protect, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });
    if (String(snippet.author) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can add collaborators' });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const targetUser = await User.findOne({ email: email.toLowerCase().trim() }).select('_id name avatar email');
    if (!targetUser) return res.status(404).json({ message: 'No user found with that email' });

    if (String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You are already the owner' });
    }

    const alreadyCollaborator = snippet.collaborators.some(c => String(c) === String(targetUser._id));
    if (alreadyCollaborator) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    snippet.collaborators.push(targetUser._id);
    await snippet.save();

    // Notify the invited user
    Notification.create({
      recipient: targetUser._id,
      sender: req.user._id,
      type: 'comment',
      message: `${req.user.name} added you as a collaborator on "${snippet.title}"`,
      link: `/snippets/${snippet._id}`,
    }).catch(console.error);

    res.json({ collaborator: targetUser, message: `${targetUser.name} added as collaborator` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/snippets/:id/collaborators/:userId — owner removes a collaborator
router.delete('/:id/collaborators/:userId', protect, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });

    const isOwner = String(snippet.author) === String(req.user._id);
    const isSelf  = String(req.params.userId) === String(req.user._id);

    // Owner can remove anyone; collaborators can remove themselves
    if (!isOwner && !isSelf) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    snippet.collaborators.pull(req.params.userId);
    await snippet.save();

    res.json({ message: 'Collaborator removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/snippets/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ snippet: req.params.id })
      .populate('author', 'name avatar')
      .sort({ createdAt: 1 })
      .lean();
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/snippets/:id/comments
router.post(
  '/:id/comments',
  protect,
  [body('content').trim().isLength({ min: 1 }).withMessage('Comment cannot be empty')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const snippet = await Snippet.findById(req.params.id).populate('author', 'name email');
      if (!snippet) return res.status(404).json({ message: 'Snippet not found' });

      const { content, parentComment } = req.body;
      const comment = await Comment.create({
        snippet: req.params.id,
        author: req.user._id,
        content,
        parentComment: parentComment || null,
      });
      await comment.populate('author', 'name avatar');

      if (String(snippet.author._id) !== String(req.user._id)) {
        Notification.create({
          recipient: snippet.author._id,
          sender: req.user._id,
          type: 'comment',
          message: `${req.user.name} commented on your snippet "${snippet.title}"`,
          link: `/snippets/${snippet._id}`,
        }).catch(console.error);
      }

      res.status(201).json({ comment });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    snippet: { type: mongoose.Schema.Types.ObjectId, ref: 'Snippet', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

commentSchema.index({ snippet: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);

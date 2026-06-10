const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true },
    language: {
      type: String,
      required: true,
      default: 'javascript',
      enum: [
        'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
        'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css',
        'sql', 'bash', 'json', 'yaml', 'markdown', 'plaintext',
      ],
    },
    description: { type: String, default: '', maxlength: 1000 },
    tags: [{ type: String, trim: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: true },
    stars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    // viewedBy tracks which authenticated accounts have seen this snippet.
    // select:false keeps it out of all API responses by default.
    viewedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], select: false, default: [] },
    forks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Snippet' }],
    forkedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Snippet', default: null },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

snippetSchema.index({ author: 1 });
snippetSchema.index({ language: 1 });
snippetSchema.index({ createdAt: -1 });
snippetSchema.index({ title: 1 });       // for regex title search
snippetSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Snippet', snippetSchema);

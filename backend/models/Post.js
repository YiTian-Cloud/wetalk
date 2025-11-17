// models/Post.js
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true, // "Eric", "Guest123", etc.
    },
    isGuest: {
      type: Boolean,
      default: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
        // NEW: number of comments on this post
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);

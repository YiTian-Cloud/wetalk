// models/Comment.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    isGuest: {
      type: Boolean,
      default: true,
    },
    content: {
      type: String,
      required: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    // For private back-and-forth threads
    recipientName: {
      type: String,
      default: null, // person on the other side of the private thread
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', CommentSchema);

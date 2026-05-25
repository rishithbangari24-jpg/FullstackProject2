const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post reference is required'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null, // If null, this is a top-level comment
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Populate author details automatically when querying comments
commentSchema.pre(/^find/, function (next) {
  this.populate('author', 'username email avatar');
  next();
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;

const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Helper to convert flat comments array to nested tree structure
const buildCommentTree = (comments) => {
  const commentMap = {};
  const rootComments = [];

  // Map all comments to a new object with replies array
  comments.forEach((comment) => {
    const commentObj = comment.toObject ? comment.toObject() : comment;
    commentObj.replies = [];
    commentMap[commentObj._id.toString()] = commentObj;
  });

  // Build the tree
  comments.forEach((comment) => {
    const commentObj = commentMap[comment._id.toString()];
    if (commentObj.parentComment) {
      const parent = commentMap[commentObj.parentComment.toString()];
      if (parent) {
        parent.replies.push(commentObj);
      } else {
        // Parent might have been deleted, treat as root
        rootComments.push(commentObj);
      }
    } else {
      rootComments.push(commentObj);
    }
  });

  return rootComments;
};

// Recursive helper to delete a comment and all its replies
const deleteCommentAndReplies = async (commentId) => {
  const replies = await Comment.find({ parentComment: commentId });
  for (const reply of replies) {
    await deleteCommentAndReplies(reply._id);
  }
  await Comment.findByIdAndDelete(commentId);
};

// @desc    Get all comments for a post structured as a tree
// @route   GET /api/comments/post/:postId
// @access  Public
const getCommentsByPost = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId }).sort({ createdAt: 1 });

    const nestedComments = buildCommentTree(comments);

    res.status(200).json({
      success: true,
      count: comments.length,
      comments: nestedComments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res, next) => {
  const { post: postId, content, parentComment } = req.body;

  try {
    if (!postId || !content) {
      res.status(400);
      return next(new Error('Post ID and comment content are required'));
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    // Verify parent comment exists if provided
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        res.status(404);
        return next(new Error('Parent comment not found'));
      }
    }

    // Create comment
    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content,
      parentComment: parentComment || null,
    });

    // Populate author details on the new comment
    const populatedComment = await Comment.findById(comment._id);

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res, next) => {
  const { content } = req.body;

  try {
    if (!content) {
      res.status(400);
      return next(new Error('Content is required to update comment'));
    }

    let comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found'));
    }

    // Verify owner
    if (comment.author._id.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('User not authorized to update this comment'));
    }

    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id);

    res.status(200).json({
      success: true,
      comment: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment and all its nested replies
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found'));
    }

    // Verify ownership: either comment author OR post author can delete comments
    const post = await Post.findById(comment.post);
    const isCommentAuthor = comment.author._id.toString() === req.user._id.toString();
    const isPostAuthor = post && post.author.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      res.status(403);
      return next(new Error('User not authorized to delete this comment'));
    }

    // Recursively delete comments and child replies
    await deleteCommentAndReplies(comment._id);

    res.status(200).json({
      success: true,
      message: 'Comment and replies deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
};

const Post = require('../models/Post');
const Comment = require('../models/Comment');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by search query
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { summary: searchRegex },
        { content: searchRegex },
      ];
    }

    // Filter by tag
    if (req.query.tag) {
      query.tags = req.query.tag.toLowerCase();
    }

    // Filter by author (e.g. user dashboard)
    if (req.query.author) {
      query.author = req.query.author;
    }

    // Fetch posts, populate author
    const posts = await Post.find(query)
      .populate('author', 'username avatar bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Post.countDocuments(query);

    // Get all unique tags for the sidebar filter
    const allPostsForTags = await Post.find({}, 'tags');
    const tagsSet = new Set();
    allPostsForTags.forEach((p) => p.tags.forEach((t) => tagsSet.add(t)));
    const uniqueTags = Array.from(tagsSet);

    res.status(200).json({
      success: true,
      count: posts.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPosts: total,
      uniqueTags,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by slug
// @route   GET /api/posts/slug/:slug
// @access  Public
const getPostBySlug = async (req, res, next) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate('author', 'username avatar bio');

    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  const { title, content, coverImage, tags } = req.body;

  try {
    if (!title || !content) {
      res.status(400);
      return next(new Error('Title and content are required'));
    }

    // Clean and split tags
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.map((t) => t.trim().toLowerCase());
      } else if (typeof tags === 'string') {
        processedTags = tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t !== '');
      }
    }

    // Create post
    const post = await Post.create({
      title,
      content,
      coverImage: coverImage || '',
      tags: processedTags,
      author: req.user._id,
    });

    const populatedPost = await Post.findById(post._id).populate('author', 'username avatar');

    res.status(201).json({
      success: true,
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res, next) => {
  const { title, content, coverImage, tags } = req.body;

  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    // Verify ownership
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('User not authorized to update this post'));
    }

    // Process tags
    let processedTags = post.tags;
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        processedTags = tags.map((t) => t.trim().toLowerCase());
      } else if (typeof tags === 'string') {
        processedTags = tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t !== '');
      }
    }

    // Update
    post.title = title || post.title;
    post.content = content || post.content;
    if (coverImage !== undefined) post.coverImage = coverImage;
    post.tags = processedTags;

    const updatedPost = await post.save();
    const populatedPost = await Post.findById(updatedPost._id).populate('author', 'username avatar');

    res.status(200).json({
      success: true,
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    // Verify ownership
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('User not authorized to delete this post'));
    }

    // Cascade delete: Remove all comments associated with this post
    await Comment.deleteMany({ post: post._id });

    // Remove the post itself
    await Post.findByIdAndDelete(post._id);

    res.status(200).json({
      success: true,
      message: 'Post and its comments successfully deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    const likeIndex = post.likes.indexOf(req.user._id);

    let liked = false;
    if (likeIndex === -1) {
      // Like post
      post.likes.push(req.user._id);
      liked = true;
    } else {
      // Unlike post
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({
      success: true,
      liked,
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
};

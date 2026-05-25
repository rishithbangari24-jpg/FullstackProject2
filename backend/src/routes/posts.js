const express = require('express');
const {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getPosts);
router.get('/slug/:slug', getPostBySlug);
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, toggleLikePost);

module.exports = router;

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [300, 'Summary cannot exceed 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Function to generate slug
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// Pre-validate hook to handle slugs and summaries
postSchema.pre('validate', async function (next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    let slugCandidate = generateSlug(this.title);
    
    // Ensure slug uniqueness
    const Post = mongoose.model('Post');
    let uniqueSlug = slugCandidate;
    let counter = 1;
    
    while (true) {
      const existing = await Post.findOne({ slug: uniqueSlug, _id: { $ne: this._id } });
      if (!existing) {
        break;
      }
      uniqueSlug = `${slugCandidate}-${counter}`;
      counter++;
    }
    
    this.slug = uniqueSlug;
  }

  // Generate automated summary from content if missing
  if (this.content && (!this.summary || this.isModified('content'))) {
    // Strip markdown headings or HTML
    const cleanText = this.content
      .replace(/[#*`_\[\]()\-]/g, '') // Simple strip markdown symbols
      .replace(/\s+/g, ' ')
      .trim();
    
    this.summary = cleanText.length > 250 ? cleanText.substring(0, 250) + '...' : cleanText;
  }

  next();
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Heart, Calendar, User, ArrowLeft, Send, Trash2, Reply, MessageSquare, Edit } from 'lucide-react';

// Re-use our custom markdown compiler
const parseMarkdownToHtml = (md) => {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/gm, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^&gt;\s+(.*?)$/gm, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^\s*\*\s+(.*?)$/gm, '<li>$1</li>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; display:block; margin:16px 0; border: 1px solid var(--border-glass);" />');

  html = html.replace(/\n\n/g, '</p><p>');

  let result = `<p>${html.replace(/\n/g, '<br/>')}</p>`
    .replace(/<p><br\/>/g, '<p>')
    .replace(/<br\/><\/p>/g, '</p>')
    .replace(/<\/p><p>/g, '</p>\n<p>')
    .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/<pre><code>(.*?)<\/code><\/pre>/gs, (match, code) => {
      return `<pre><code>${code.replace(/<br\/>/g, '\n')}</code></pre>`;
    });

  return result;
};

// Deterministic Gradient helper
const getDeterministicGradient = (str) => {
  if (!str) return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    ['#6366f1', '#8b5cf6'],
    ['#ec4899', '#8b5cf6'],
    ['#f43f5e', '#ec4899'],
    ['#06b6d4', '#3b82f6'],
    ['#8b5cf6', '#d946ef'],
    ['#3b82f6', '#6366f1'],
  ];
  const idx = Math.abs(hash) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
};

const BlogDetails = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  
  // Root comment input state
  const [rootCommentText, setRootCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const navigate = useNavigate();

  // Load post details and comments tree
  const loadPostDetails = async () => {
    try {
      setLoading(true);
      const postRes = await api.get(`/posts/${slug}`);
      if (postRes.data && postRes.data.post) {
        const postData = postRes.data.post;
        setPost(postData);
        
        // Setup initial like state
        if (user?._id) {
          setLiked(postData.likes?.includes(user._id));
        }

        // Fetch hierarchical comments
        const commentsRes = await api.get(`/comments/post/${postData._id}`);
        if (commentsRes.data && commentsRes.data.comments) {
          setComments(commentsRes.data.comments);
        }
      }
    } catch (err) {
      console.error('Error loading post details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostDetails();
  }, [slug, user?._id]);

  // Handle Like/Unlike toggle
  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      // Optimistic UI updates
      const originalLikes = [...post.likes];
      const hasLiked = originalLikes.includes(user._id);
      let updatedLikes;
      
      if (hasLiked) {
        updatedLikes = originalLikes.filter((id) => id !== user._id);
      } else {
        updatedLikes = [...originalLikes, user._id];
      }

      setPost({ ...post, likes: updatedLikes });
      setLiked(!hasLiked);

      // Perform actual network request
      const res = await api.put(`/posts/${post._id}/like`);
      if (res.data && res.data.likes) {
        setPost({ ...post, likes: res.data.likes });
        setLiked(res.data.likes.includes(user._id));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Create Root Comment
  const handleAddRootComment = async (e) => {
    e.preventDefault();
    if (!rootCommentText.trim()) return;

    try {
      setCommentSubmitting(true);
      const res = await api.post('/comments', {
        postId: post._id,
        content: rootCommentText
      });

      if (res.data && res.data.comment) {
        // Root comment gets pushed into comments array
        const newComment = {
          ...res.data.comment,
          author: { _id: user._id, username: user.username, avatar: user.avatar },
          replies: []
        };
        setComments([newComment, ...comments]);
        setRootCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Helper to dynamically insert reply into comments tree state
  const insertReplyIntoTree = (nodes, parentId, newReply) => {
    return nodes.map((node) => {
      if (node._id === parentId) {
        return {
          ...node,
          replies: [newReply, ...node.replies]
        };
      } else if (node.replies && node.replies.length > 0) {
        return {
          ...node,
          replies: insertReplyIntoTree(node.replies, parentId, newReply)
        };
      }
      return node;
    });
  };

  // Helper to dynamically remove comment/replies from comments tree state
  const removeCommentFromTree = (nodes, targetId) => {
    return nodes
      .filter((node) => node._id !== targetId)
      .map((node) => {
        if (node.replies && node.replies.length > 0) {
          return {
            ...node,
            replies: removeCommentFromTree(node.replies, targetId)
          };
        }
        return node;
      });
  };

  // Recursive Comment Node Component
  const CommentNode = ({ comment, depth = 0 }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);

    const formattedDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const handleAddReply = async (e) => {
      e.preventDefault();
      if (!replyText.trim()) return;

      try {
        setReplySubmitting(true);
        const res = await api.post('/comments', {
          postId: post._id,
          parentId: comment._id,
          content: replyText
        });

        if (res.data && res.data.comment) {
          const newReply = {
            ...res.data.comment,
            author: { _id: user._id, username: user.username, avatar: user.avatar },
            replies: []
          };
          
          // Update nested comments tree state
          const updatedTree = insertReplyIntoTree(comments, comment._id, newReply);
          setComments(updatedTree);
          
          setReplyText('');
          setShowReplyForm(false);
        }
      } catch (err) {
        console.error('Error adding reply:', err);
      } finally {
        setReplySubmitting(false);
      }
    };

    const handleDeleteComment = async () => {
      if (!window.confirm('Delete this comment? Sub-replies will also be recursively deleted.')) return;

      try {
        await api.delete(`/comments/${comment._id}`);
        // Update tree state by removing node
        const updatedTree = removeCommentFromTree(comments, comment._id);
        setComments(updatedTree);
      } catch (err) {
        console.error('Error deleting comment:', err);
      }
    };

    const isCommentAuthor = user?._id === comment.author?._id || user?._id === comment.author;

    return (
      <div style={{
        marginLeft: depth > 0 ? `${Math.min(depth * 24, 72)}px` : '0',
        marginTop: '16px',
        borderLeft: depth > 0 ? '2px solid var(--border-glass)' : 'none',
        paddingLeft: depth > 0 ? '16px' : '0',
      }}>
        {/* Comment Bubble */}
        <div className="glass-card" style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.01)',
          borderColor: isCommentAuthor ? 'rgba(139, 92, 246, 0.2)' : 'var(--border-glass)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {comment.author?.avatar ? (
                <img 
                  src={comment.author.avatar} 
                  alt={comment.author.username} 
                  style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--border-glass)' }} 
                />
              ) : (
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifySelf: 'center', fontSize: '0.7rem', fontWeight: 600, justifyContent: 'center' }}>
                  {comment.author?.username?.substring(0, 2).toUpperCase() || 'U'}
                </div>
              )}
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{comment.author?.username || 'Writer'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formattedDate}</span>
            </div>

            {/* Actions toolbar */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {isAuthenticated && (
                <button 
                  onClick={() => setShowReplyForm(!showReplyForm)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Reply size={12} />
                  <span style={{ fontSize: '0.75rem' }}>Reply</span>
                </button>
              )}
              {isCommentAuthor && (
                <button 
                  onClick={handleDeleteComment} 
                  style={{ background: 'none', border: 'none', color: '#fda4af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#fda4af'}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Comment content body */}
          <p style={{ fontSize: '0.92rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
            {comment.content}
          </p>
        </div>

        {/* Inline Reply Form */}
        {showReplyForm && (
          <form onSubmit={handleAddReply} style={{
            display: 'flex', 
            gap: '12px', 
            marginTop: '8px', 
            marginLeft: '16px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder={`Reply to ${comment.author?.username || 'user'}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }} disabled={replySubmitting}>
              <Send size={12} />
            </button>
          </form>
        )}

        {/* Child comments (Recursion) */}
        {comment.replies && comment.replies.map((child) => (
          <CommentNode key={child._id} comment={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.05)',
          borderTop: '3px solid var(--accent-indigo)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <p style={{ color: 'var(--text-muted)' }}>Decoding cosmic signals...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '40px auto' }}>
        <h3 style={{ marginBottom: '12px' }}>Cosmic Event Horizon</h3>
        <p style={{ color: 'var(--text-secondary)' }}>The requested article could not be retrieved. It may have drifted into a black hole.</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '20px' }}>Back to safety</Link>
      </div>
    );
  }

  const isPostAuthor = user?._id === post.author?._id || user?._id === post.author;
  const gradientCover = getDeterministicGradient(post.title);
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="animate-slide" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Return Navigation */}
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }} onMouseOver={(e)=>e.currentTarget.style.color='#fff'} onMouseOut={(e)=>e.currentTarget.style.color='var(--text-secondary)'}>
        <ArrowLeft size={16} />
        <span>Return to Feed</span>
      </Link>

      {/* Cover Backdrop Banner */}
      <div style={{
        height: '320px',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '40px',
        border: '1px solid var(--border-glass)'
      }}>
        {post.coverImage ? (
          <img 
            src={post.coverImage} 
            alt={post.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: gradientCover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: 800,
            textAlign: 'center',
            textShadow: '0 4px 15px rgba(0,0,0,0.4)'
          }}>
            {post.title}
          </div>
        )}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(3,0,20,0.1) 0%, rgba(3,0,20,0.85) 100%)'
        }} />
      </div>

      {/* Author and Date Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Author Avatar Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {post.author?.avatar ? (
            <img 
              src={post.author.avatar} 
              alt={post.author.username} 
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-indigo)' }} 
            />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifySelf: 'center', fontWeight: 600, justifyContent: 'center' }}>
              {post.author?.username?.substring(0, 2).toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{post.author?.username || 'Writer'}</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Toolbar edit actions */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isPostAuthor && (
            <Link to={`/edit/${post.slug}`} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
              <Edit size={14} />
              <span>Edit Article</span>
            </Link>
          )}

          {/* Likes toggler */}
          <button 
            onClick={handleLikeToggle} 
            className="btn" 
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              borderRadius: '99px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: liked ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255,255,255,0.03)',
              borderColor: liked ? 'var(--accent-rose)' : 'var(--border-glass)',
              color: liked ? '#fca5a5' : 'var(--text-secondary)'
            }}
          >
            <Heart size={14} color="var(--accent-rose)" fill={liked ? "var(--accent-rose)" : "none"} />
            <span style={{ fontWeight: 600 }}>{post.likes?.length || 0} Likes</span>
          </button>
        </div>
      </div>

      {/* Main H1 Title */}
      <h1 style={{
        fontSize: '2.8rem',
        fontWeight: 800,
        marginBottom: '20px',
        fontFamily: 'var(--font-display)',
        lineHeight: '1.1',
        letterSpacing: '-0.02em'
      }}>
        {post.title}
      </h1>

      {/* Tags list */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {post.tags.map((tag, idx) => (
            <span key={idx} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Excerpt Excerpt Box */}
      <p style={{
        fontSize: '1.2rem',
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
        borderLeft: '4px solid var(--accent-indigo)',
        paddingLeft: '20px',
        marginBottom: '40px',
        fontStyle: 'italic'
      }}>
        {post.summary}
      </p>

      {/* Article Content Render Area */}
      <article 
        className="markdown-body animate-fade" 
        style={{
          borderBottom: '1px solid var(--border-glass)',
          paddingBottom: '40px',
          marginBottom: '40px'
        }}
        dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(post.content) }}
      />

      {/* Hierarchical Comments section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={20} color="var(--accent-indigo)" />
          <span>Discussion Universe</span>
        </h3>

        {/* Comment Creation Form */}
        {isAuthenticated ? (
          <form onSubmit={handleAddRootComment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              placeholder="Inject your thoughts into the discussion nebula..."
              value={rootCommentText}
              onChange={(e) => setRootCommentText(e.target.value)}
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} disabled={commentSubmitting}>
              {commentSubmitting ? 'Transmitting...' : 'Post Thought'}
              <Send size={14} />
            </button>
          </form>
        ) : (
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.9rem' }}>
              Want to join the conversation?{' '}
              <Link to="/login" style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>Sign In</Link> or{' '}
              <Link to="/register" style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>Create an account</Link>
            </span>
          </div>
        )}

        {/* Recursive Comment Nodes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <CommentNode key={comment._id} comment={comment} />
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
              Silence in this sector. Draft the very first comment!
            </p>
          )}
        </div>

      </section>
    </div>
  );
};

export default BlogDetails;

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Calendar, ArrowRight } from 'lucide-react';

// Generates a deterministic gradient based on a string hash
const getDeterministicGradient = (str) => {
  if (!str) return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    ['#6366f1', '#8b5cf6'], // Indigo -> Violet
    ['#ec4899', '#8b5cf6'], // Pink -> Violet
    ['#f43f5e', '#ec4899'], // Rose -> Pink
    ['#06b6d4', '#3b82f6'], // Cyan -> Blue
    ['#8b5cf6', '#d946ef'], // Violet -> Fuchsia
    ['#3b82f6', '#6366f1'], // Blue -> Indigo
  ];
  const idx = Math.abs(hash) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
};

const BlogCard = ({ post }) => {
  const { title, slug, summary, coverImage, author, tags, likes, createdAt } = post;

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const cardGradient = getDeterministicGradient(title);

  return (
    <article className="glass-card" style={{
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* Cover Image or Gradient */}
      <Link to={`/post/${slug}`} style={{ display: 'block', overflow: 'hidden', position: 'relative', height: '180px' }}>
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={title} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: cardGradient,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.2rem',
            textAlign: 'center',
            textShadow: '0 4px 10px rgba(0,0,0,0.3)',
          }}>
            {title.length > 40 ? title.substring(0, 40) + '...' : title}
            {/* Glossy overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)'
            }} />
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', height: '48px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.3' }}>
          <Link to={`/post/${slug}`} style={{ color: 'var(--text-primary)' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-indigo)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-primary)'}>
            {title}
          </Link>
        </h3>

        {/* Summary Excerpt */}
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          marginBottom: '20px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          height: '60px',
          lineHeight: '1.5'
        }}>
          {summary}
        </p>

        {/* Card Footer (Author & Metas) */}
        <div style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-glass)',
          paddingTop: '16px',
        }}>
          {/* Author info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {author?.avatar ? (
              <img 
                src={author.avatar} 
                alt={author.username} 
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-glass)' }} 
              />
            ) : (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                {author?.username?.substring(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {author?.username || 'Writer'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={10} />
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Likes counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <Heart size={14} color="var(--accent-rose)" fill="var(--accent-rose)" style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{likes?.length || 0}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;

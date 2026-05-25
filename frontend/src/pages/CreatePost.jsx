import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Editor from '../components/Editor';
import { Send, FileText, Tag, Image as ImageIcon, AlertCircle } from 'lucide-react';

const CreatePost = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [summary, setSummary] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !content || !summary) {
      setError('Title, Summary, and Content body are strictly required.');
      return;
    }

    // Process tags comma list
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      setLoading(true);
      const res = await api.post('/posts', {
        title,
        coverImage: coverImage || undefined,
        summary,
        tags,
        content,
      });

      if (res.data && res.data.post) {
        navigate(`/post/${res.data.post.slug}`);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.response?.data?.message || 'Error occurred while creating post. Check server console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide" style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
          Compose Cosmic Article
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Write down your ideas and share them with the Nebula developer universe.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Title & Summary (Glass Container) */}
        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Title */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" htmlFor="title">Article Title</label>
            <div style={{ position: 'relative' }}>
              <FileText size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
              <input
                id="title"
                type="text"
                placeholder="e.g. Navigating React 19: The Complete Guide"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>
          </div>

          {/* Excerpt Summary */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" htmlFor="summary">Brief Summary (Excerpt)</label>
            <textarea
              id="summary"
              placeholder="Provide a quick overview of what your article is about..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              maxLength={250}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
              {250 - summary.length} characters remaining
            </span>
          </div>
        </div>

        {/* Media & Metadata (Glass Container) */}
        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Cover image URL */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="coverImage">Cover Image URL (Optional)</label>
              <div style={{ position: 'relative' }}>
                <ImageIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                <input
                  id="coverImage"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            {/* Tags Input */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="tags">Tags (Comma-separated)</label>
              <div style={{ position: 'relative' }}>
                <Tag size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                <input
                  id="tags"
                  type="text"
                  placeholder="Technology, WebDev, UI"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Composer Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="input-label">Article Body Content (Markdown Supported)</label>
          <Editor value={content} onChange={setContent} placeholder="Start crafting your masterpiece here using markdown..." />
        </div>

        {/* Error message */}
        {error && (
          <div className="glass-card animate-fade" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderColor: 'rgba(244, 63, 94, 0.3)',
            background: 'rgba(244, 63, 94, 0.05)',
            color: '#fda4af',
            borderRadius: '12px',
          }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {/* Submission Toolbar */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            style={{ padding: '12px 24px' }}
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '12px 30px' }}
            disabled={loading}
          >
            {loading ? (
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTop: '2px solid #fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <>
                <span>Publish Article</span>
                <Send size={15} />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreatePost;

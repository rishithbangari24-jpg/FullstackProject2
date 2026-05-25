import React, { useState, useEffect } from 'react';
import { Search, Compass, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import BlogCard from '../components/BlogCard';
import { Link } from 'react-router-dom';

const FILTER_TAGS = ['All', 'Technology', 'Design', 'Programming', 'Lifestyle', 'Business', 'WebDev'];

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [error, setError] = useState('');

  // Fetch posts with optional search & tag parameters
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      
      let url = '/posts';
      const params = [];
      
      if (search) {
        params.push(`search=${encodeURIComponent(search)}`);
      }
      
      if (selectedTag && selectedTag !== 'All') {
        params.push(`tag=${encodeURIComponent(selectedTag)}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await api.get(url);
      if (res.data && res.data.posts) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Could not retrieve posts. Please verify database connection or server status.');
    } finally {
      setLoading(false);
    }
  };

  // Re-run search/tag query
  useEffect(() => {
    // Small debounce for search
    const timer = setTimeout(() => {
      fetchPosts();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, selectedTag]);

  return (
    <div className="animate-slide" style={{ width: '100%' }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '60px 20px',
        marginBottom: '40px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Glowing floating decorative ambient blur */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1
        }} />

        <div className="tag animate-float" style={{ marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          ✨ Discover Infinite Wisdom
        </div>
        
        <h1 className="text-gradient-rainbow" style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          marginBottom: '16px',
          fontFamily: 'var(--font-display)',
          lineHeight: '1.1',
          maxWidth: '800px',
        }}>
          Explore the Frontiers of Digital Knowledge
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          marginBottom: '32px',
          fontFamily: 'var(--font-body)',
        }}>
          NebulaPress bridges clean code and modern design to build the premier full stack community.
        </p>

        {/* Search bar & Tag container */}
        <div className="glass-card" style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 14px',
          width: '100%',
          maxWidth: '550px',
          borderRadius: '12px',
          border: '1px solid var(--border-glass)',
          background: 'rgba(0, 0, 0, 0.4)',
        }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />
          <input
            type="text"
            placeholder="Search titles, summaries, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              width: '100%',
              padding: '8px 0',
            }}
          />
        </div>
      </section>

      {/* Horizontal Tag Filters */}
      <section style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '48px',
      }}>
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className="btn"
            style={{
              padding: '8px 16px',
              borderRadius: '99px',
              fontSize: '0.85rem',
              fontWeight: 500,
              background: selectedTag === tag ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.03)',
              color: selectedTag === tag ? '#fff' : 'var(--text-secondary)',
              borderColor: selectedTag === tag ? 'var(--accent-indigo)' : 'var(--border-glass)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            {tag}
          </button>
        ))}
      </section>

      {/* Error State */}
      {error && (
        <div className="glass-card animate-fade" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '20px',
          borderColor: 'rgba(244, 63, 94, 0.3)',
          background: 'rgba(244, 63, 94, 0.05)',
          color: '#fda4af',
          marginBottom: '40px',
        }}>
          <AlertCircle size={24} />
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Server Status Warning</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.85 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Main feed grid layout */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.05)',
            borderTop: '3px solid var(--accent-indigo)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Scanning nebula for articles...</p>
        </div>
      ) : posts.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '30px',
          marginBottom: '60px',
        }}>
          {posts.map((post) => (
            <div key={post._id} className="animate-fade">
              <BlogCard post={post} />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '60px 40px',
          maxWidth: '500px',
          margin: '0 auto 60px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            padding: '20px',
            borderRadius: '50%',
            color: 'var(--accent-indigo)',
            marginBottom: '20px',
          }}>
            <Compass size={40} />
          </div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>No Cosmic Articles Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
            We couldn't find any matching posts. Be the pioneer and launch the very first one!
          </p>
          <Link to="/create" className="btn btn-primary">
            <span>Publish First Article</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;

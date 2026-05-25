import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Shield, BookOpen, Clock, Heart, Edit, Trash2, Award, Save, Key, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', // Female dev
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', // Male dev
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', // Designer
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', // Engineer
];

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Settings forms states
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  
  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState('posts'); // posts, settings, security
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  // Fetch author posts
  const fetchMyPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await api.get('/posts');
      if (res.data && res.data.posts) {
        // Filter posts created by this specific user
        const filtered = res.data.posts.filter(
          (p) => p.author?._id === user?._id || p.author === user?._id
        );
        setMyPosts(filtered);
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchMyPosts();
    }
  }, [user]);

  // Update profile details handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });
    setSaving(true);

    try {
      const res = await updateProfile({ username, bio, avatar });
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Cosmic profile updated successfully!' });
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error saving profile details.' });
    } finally {
      setSaving(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile({ currentPassword, newPassword });
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Security credentials rotated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to update password.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error rotating password credentials.' });
    } finally {
      setSaving(false);
    }
  };

  // Delete article handler
  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this cosmic post? This will destroy all nested comments.')) {
      return;
    }

    try {
      await api.delete(`/posts/${id}`);
      setMyPosts(myPosts.filter((p) => p._id !== id));
      setStatusMsg({ type: 'success', text: 'Article deleted successfully.' });
    } catch (err) {
      console.error('Error deleting post:', err);
      setStatusMsg({ type: 'error', text: 'Failed to delete post.' });
    }
  };

  const totalLikes = myPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);

  return (
    <div className="animate-slide" style={{ width: '100%' }}>
      {/* Profile Banner */}
      <section className="glass-card" style={{
        padding: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
        flexWrap: 'wrap',
        marginBottom: '40px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '100%',
          background: 'radial-gradient(circle at 100% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          borderRadius: '16px'
        }} />

        {/* Profile Avatar */}
        <div style={{ position: 'relative' }}>
          {avatar ? (
            <img 
              src={avatar} 
              alt={user?.username} 
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '4px solid var(--accent-violet)',
                objectFit: 'cover',
                boxShadow: '0 0 20px rgba(139,92,246,0.3)'
              }}
            />
          ) : (
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 800
            }}>
              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
            </div>
          )}
          <span style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            background: '#10b981',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: '3px solid var(--bg-deep)',
          }} title="Active Session" />
        </div>

        {/* Username/Bio details */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              {user?.username}
            </h2>
            <span className="tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={12} />
              <span>Cosmos Writer</span>
            </span>
          </div>
          
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
            <Mail size={14} />
            <span>{user?.email}</span>
          </p>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: '1.5',
            background: 'rgba(0,0,0,0.2)',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-glass)'
          }}>
            {user?.bio || "No custom biography established yet. Edit settings to update your signature."}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '20px', minWidth: '200px' }}>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
            <BookOpen size={20} color="var(--accent-indigo)" style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{myPosts.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Articles</span>
          </div>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
            <Heart size={20} color="var(--accent-rose)" style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalLikes}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Likes</span>
          </div>
        </div>
      </section>

      {/* Tabs Control */}
      <section style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-glass)',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <button
          onClick={() => { setActiveTab('posts'); setStatusMsg({type:'',text:''}); }}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'posts' ? '#fff' : 'var(--text-secondary)',
            padding: '12px 4px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'posts' ? '2px solid var(--accent-indigo)' : '2px solid transparent',
            transition: 'var(--transition-fast)'
          }}
        >
          My Articles ({myPosts.length})
        </button>
        <button
          onClick={() => { setActiveTab('settings'); setStatusMsg({type:'',text:''}); }}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'settings' ? '#fff' : 'var(--text-secondary)',
            padding: '12px 4px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'settings' ? '2px solid var(--accent-indigo)' : '2px solid transparent',
            transition: 'var(--transition-fast)'
          }}
        >
          Edit Profile
        </button>
        <button
          onClick={() => { setActiveTab('security'); setStatusMsg({type:'',text:''}); }}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'security' ? '#fff' : 'var(--text-secondary)',
            padding: '12px 4px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'security' ? '2px solid var(--accent-indigo)' : '2px solid transparent',
            transition: 'var(--transition-fast)'
          }}
        >
          Security settings
        </button>
      </section>

      {/* Dynamic Status Banner */}
      {statusMsg.text && (
        <div className="glass-card animate-fade" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 20px',
          borderColor: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)',
          color: statusMsg.type === 'success' ? '#a7f3d0' : '#fda4af',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '0.9rem'
        }}>
          {statusMsg.type === 'success' ? <UserCheck size={18} /> : <Shield size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Tab Panels */}
      <div style={{ marginBottom: '60px' }}>
        
        {/* PANEL: MY ARTICLES LIST */}
        {activeTab === 'posts' && (
          <div className="animate-fade">
            {loadingPosts ? (
              <p style={{ color: 'var(--text-muted)' }}>Retrieving your database records...</p>
            ) : myPosts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {myPosts.map((post) => (
                  <div key={post._id} className="glass-card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    gap: '20px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <h4 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
                        <Link to={`/post/${post.slug}`} style={{ color: 'var(--text-primary)' }} onMouseOver={(e) => e.currentTarget.style.color='var(--accent-indigo)'} onMouseOut={(e) => e.currentTarget.style.color='var(--text-primary)'}>
                          {post.title}
                        </Link>
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Heart size={12} color="var(--accent-rose)" fill="var(--accent-rose)" />
                          {post.likes?.length || 0} likes
                        </span>
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Link to={`/edit/${post.slug}`} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                        <Edit size={12} />
                        <span>Edit</span>
                      </Link>
                      <button onClick={() => handleDeletePost(post._id)} className="btn btn-danger" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <BookOpen size={30} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <h4>No Articles Drafted</h4>
                <p style={{ fontSize: '0.9rem', marginTop: '6px', color: 'var(--text-muted)' }}>You haven't written any articles yet.</p>
              </div>
            )}
          </div>
        )}

        {/* PANEL: PROFILE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="glass-card animate-fade" style={{ padding: '40px', maxWidth: '600px' }}>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={18} color="var(--accent-indigo)" />
                <span>Personal Customization</span>
              </h3>

              {/* Username */}
              <div className="input-group">
                <label className="input-label" htmlFor="username">Username Signature</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Bio */}
              <div className="input-group">
                <label className="input-label" htmlFor="bio">Author Biography</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              {/* Preset Avatars Selector */}
              <div className="input-group">
                <label className="input-label">Avatar Quick Presets</label>
                <div style={{ display: 'flex', gap: '16px', margin: '8px 0' }}>
                  {AVATAR_PRESETS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`preset-${idx}`}
                      onClick={() => setAvatar(url)}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: avatar === url ? '3px solid var(--accent-indigo)' : '2px solid transparent',
                        opacity: avatar === url ? 1 : 0.6,
                        transition: 'var(--transition-fast)'
                      }}
                    />
                  ))}
                </div>

                {/* Avatar URL override */}
                <label className="input-label" htmlFor="avatarUrl" style={{ marginTop: '8px' }}>Or Custom Avatar Image URL</label>
                <input
                  id="avatarUrl"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '12px 24px' }} disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Profile details'}</span>
              </button>
            </form>
          </div>
        )}

        {/* PANEL: SECURITY PASSWORD ROTATION */}
        {activeTab === 'security' && (
          <div className="glass-card animate-fade" style={{ padding: '40px', maxWidth: '600px' }}>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Key size={18} color="var(--accent-rose)" />
                <span>Rotate Security Credentials</span>
              </h3>

              {/* Current Password */}
              <div className="input-group">
                <label className="input-label" htmlFor="currPass">Current Secure Password</label>
                <input
                  id="currPass"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* New Password */}
              <div className="input-group">
                <label className="input-label" htmlFor="newPass">New Secure Password</label>
                <input
                  id="newPass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="form-input"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="input-group">
                <label className="input-label" htmlFor="confPass">Confirm New Password</label>
                <input
                  id="confPass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '12px 24px', background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))' }} disabled={saving}>
                <Shield size={16} />
                <span>{saving ? 'Rotating...' : 'Rotate password credentials'}</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;

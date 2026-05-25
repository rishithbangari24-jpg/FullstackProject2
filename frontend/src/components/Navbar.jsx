import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, PlusCircle, BookOpen, LogIn, UserPlus } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      zIndex: 1000,
      borderBottom: '1px solid var(--border-glass)',
    }}>
      {/* Brand Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))',
          padding: '6px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <BookOpen size={20} color="#fff" />
        </div>
        <span className="text-gradient-rainbow" style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '1.4rem',
          letterSpacing: '-0.03em',
        }}>
          NebulaPress
        </span>
      </Link>

      {/* Navigation Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {isAuthenticated ? (
          <>
            <Link 
              to="/create" 
              className="btn btn-secondary" 
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                borderColor: isActive('/create') ? 'var(--accent-indigo)' : 'var(--border-glass)'
              }}
            >
              <PlusCircle size={15} />
              <span>Write</span>
            </Link>

            <Link 
              to="/profile" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px',
                borderRadius: '8px',
                background: isActive('/profile') ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: '1px solid',
                borderColor: isActive('/profile') ? 'var(--border-glass-hover)' : 'transparent'
              }}
            >
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '2px solid var(--accent-violet)'
                  }} 
                />
              ) : (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--accent-indigo)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={14} color="#fff" />
                </div>
              )}
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {user?.username}
              </span>
            </Link>

            <button 
              onClick={handleLogout} 
              className="btn btn-danger" 
              style={{ padding: '6px 12px', fontSize: '0.85rem', height: '34px' }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isActive('/login') ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                padding: '8px 12px',
              }}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>

            <Link 
              to="/register" 
              className="btn btn-primary" 
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <UserPlus size={15} />
              <span>Sign Up</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

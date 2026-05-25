import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-glass)',
      background: 'rgba(3, 0, 20, 0.8)',
      backdropFilter: 'blur(10px)',
      padding: '24px 40px',
      marginTop: 'auto',
      textAlign: 'center',
      zIndex: 10,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} NebulaPress. Created with passion for web design excellence.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="#" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Terms</a>
          <a href="#" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Privacy</a>
          <a href="#" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Docs</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

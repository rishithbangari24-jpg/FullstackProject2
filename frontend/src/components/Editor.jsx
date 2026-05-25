import React, { useState, useRef } from 'react';
import { Bold, Italic, Heading1, Heading2, Quote, Code, Link, Image, Eye, PenTool, Columns } from 'lucide-react';

// Custom Markdown compiler in JS
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
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^&gt;\s+(.*?)$/gm, '<blockquote>$1</blockquote>');

  // Unordered list items
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^\s*\*\s+(.*?)$/gm, '<li>$1</li>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; display:block; margin:16px 0; border: 1px solid var(--border-glass);" />');

  // Double newline splits for paragraphs
  html = html.replace(/\n\n/g, '</p><p>');

  // Wrap inside paragraphs and fix newlines
  let result = `<p>${html.replace(/\n/g, '<br/>')}</p>`
    .replace(/<p><br\/>/g, '<p>')
    .replace(/<br\/><\/p>/g, '</p>')
    .replace(/<\/p><p>/g, '</p>\n<p>')
    .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    // Clean up code blocks from extra br tags
    .replace(/<pre><code>(.*?)<\/code><\/pre>/gs, (match, code) => {
      return `<pre><code>${code.replace(/<br\/>/g, '\n')}</code></pre>`;
    });

  return result;
};

const Editor = ({ value, onChange, placeholder = 'Write your thoughts in markdown...' }) => {
  const [viewMode, setViewMode] = useState('split'); // write, preview, split
  const textareaRef = useRef(null);

  // Helper to insert markdown tags at selection
  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const replacement = prefix + (selectedText || 'text') + suffix;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    onChange(newValue);

    // Reposition cursor after DOM update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || 'text').length);
    }, 0);
  };

  const previewHtml = parseMarkdownToHtml(value);

  return (
    <div className="glass-card animate-fade" style={{ display: 'flex', flexDirection: 'column', height: '550px', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
      {/* Editor Format Bar & Tab Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid var(--border-glass)'
      }}>
        {/* Formatting Shortcuts */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => insertMarkdown('**', '**')} className="btn btn-secondary" style={{ padding: '6px', minWidth: '32px', height: '32px' }} title="Bold">
            <Bold size={14} />
          </button>
          <button type="button" onClick={() => insertMarkdown('*', '*')} className="btn btn-secondary" style={{ padding: '6px', minWidth: '32px', height: '32px' }} title="Italic">
            <Italic size={14} />
          </button>
          <button type="button" onClick={() => insertMarkdown('# ')} className="btn btn-secondary" style={{ padding: '6px', minWidth: '32px', height: '32px' }} title="Heading 1">
            <Heading1 size={14} />
          </button>
          <button type="button" onClick={() => insertMarkdown('## ')} className="btn btn-secondary" style={{ padding: '6px', minWidth: '32px', height: '32px' }} title="Heading 2">
            <Heading2 size={14} />
          </button>
          <button type="button" onClick={() => insertMarkdown('> ')} className="btn btn-secondary" style={{ padding: '6px', minWidth: '32px', height: '32px' }} title="Quote">
            <Quote size={14} />
          </button>
          <button type="button" onClick={() => insertMarkdown('`', '`')} className="btn btn-secondary" style={{ padding: '6px', minWidth: '32px', height: '32px' }} title="Inline Code">
            <Code size={14} />
          </button>
          <button type="button" onClick={() => insertMarkdown('[', '](url)')} className="btn btn-secondary" style={{ padding: '6px', minWidth: '32px', height: '32px' }} title="Insert Link">
            <Link size={14} />
          </button>
          <button type="button" onClick={() => insertMarkdown('![alt](', ')') } className="btn btn-secondary" style={{ padding: '6px', minWidth: '32px', height: '32px' }} title="Insert Image">
            <Image size={14} />
          </button>
        </div>

        {/* View Mode Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              background: viewMode === 'write' ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: viewMode === 'write' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <PenTool size={12} />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              background: viewMode === 'split' ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: viewMode === 'split' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <Columns size={12} />
            <span>Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              background: viewMode === 'preview' ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: viewMode === 'preview' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <Eye size={12} />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100% - 57px)', overflow: 'hidden' }}>
        {/* Editor Area */}
        {(viewMode === 'write' || viewMode === 'split') && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="form-textarea"
            style={{
              flex: 1,
              height: '100%',
              resize: 'none',
              border: 'none',
              borderRadius: 0,
              background: 'transparent',
              padding: '20px',
              fontSize: '1rem',
              lineHeight: '1.6',
              fontFamily: 'monospace',
              borderRight: viewMode === 'split' ? '1px solid var(--border-glass)' : 'none',
              overflowY: 'auto'
            }}
          />
        )}

        {/* HTML Preview Area */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className="markdown-body"
            style={{
              flex: 1,
              height: '100%',
              overflowY: 'auto',
              padding: '20px',
              background: viewMode === 'preview' ? 'transparent' : 'rgba(0,0,0,0.1)'
            }}
            dangerouslySetInnerHTML={{ __html: previewHtml || `<p style="color:var(--text-muted); font-style:italic;">Nothing to preview yet...</p>` }}
          />
        )}
      </div>
    </div>
  );
};

export default Editor;

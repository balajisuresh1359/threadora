import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { getTrackColor } from '../utils/trackColors';

export function QuickSwitcher({ onClose, onSnapshot }) {
  const threads = useTaskStore(s => s.threads);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  const active = threads.filter(t => t.status !== 'closed');
  const filtered = active.filter(t =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelected(0); }, [query]);

  const STATUS_COLORS = {
    active: 'hsl(var(--status-active))',
    paused: 'hsl(var(--status-paused))',
    stuck:  'hsl(var(--status-stuck))',
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(i => Math.min(i+1, filtered.length-1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(i => Math.max(i-1, 0)); }
    else if (e.key === 'Enter') {
      const t = filtered[selected];
      if (t) { if (t.status === 'active') onSnapshot(t); onClose(); }
    }
    else if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="qs-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            width: '100%', maxWidth: 480,
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-modal)',
          }}
        >
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid hsl(var(--border))',
          }}>
            <Search size={14} style={{ color: 'hsl(var(--text-meta))', flexShrink: 0 }} />
            <input
              ref={inputRef}
              style={{
                flex: 1, fontSize: 14, color: 'hsl(var(--text-title))',
                background: 'transparent', border: 'none', outline: 'none',
              }}
              placeholder="Jump to thread…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={onClose} style={{ border: 'none', background: 'none', color: 'hsl(var(--text-meta))', cursor: 'pointer' }}>
              <X size={13} />
            </button>
          </div>

          {/* Results */}
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: 'hsl(var(--text-meta))' }}>
                No threads match “{query}”
              </p>
            ) : (
              filtered.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => { if (t.status === 'active') onSnapshot(t); onClose(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', textAlign: 'left', border: 'none',
                    background: i === selected ? 'hsl(var(--primary-subtle))' : 'transparent',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-muted"
                >
                  {t.emoji && <span style={{ fontSize: 14, flexShrink: 0 }}>{t.emoji}</span>}
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[t.status], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'hsl(var(--text-title))',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: '2px 7px',
                    borderRadius: 'var(--radius-pill)', flexShrink: 0,
                    background: `${getTrackColor(t.track)}18`,
                    color: getTrackColor(t.track),
                  }}>{t.track}</span>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px',
            borderTop: '1px solid hsl(var(--border))',
          }}>
            <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>
              <span className="kbd">⇕</span> navigate
              <span style={{ margin: '0 6px' }}>·</span>
              <span className="kbd">Enter</span> snapshot
              <span style={{ margin: '0 6px' }}>·</span>
              <span className="kbd">Esc</span> close
            </span>
            <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>{filtered.length} threads</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

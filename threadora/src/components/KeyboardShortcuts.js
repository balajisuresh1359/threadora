import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Cmd', 'S'],     desc: 'Snapshot the current active thread' },
  { keys: ['Cmd', 'K'],     desc: 'Open quick thread switcher' },
  { keys: ['Cmd', 'N'],     desc: 'Create a new thread' },
  { keys: ['1-7'],          desc: 'Switch tabs (All / Active / Paused / Stuck / Priority / Delayed / Nudges)' },
  { keys: ['J / K'],        desc: 'Navigate threads up / down' },
  { keys: ['Enter'],        desc: 'Open focused thread preview' },
  { keys: ['R'],            desc: 'Resume focused paused/stuck/delayed thread' },
  { keys: ['B'],            desc: 'Mark focused thread as Stuck' },
  { keys: ['Cmd', 'Enter'], desc: 'Save snapshot (inside modal)' },
  { keys: ['Tab'],          desc: 'Move between snapshot fields' },
  { keys: ['Esc'],          desc: 'Close any modal or drawer' },
  { keys: ['?'],            desc: 'Show this panel' },
];

export function KeyboardShortcuts({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="modal-card"
          style={{ maxWidth: 420 }}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--text-title))' }}>Keyboard Shortcuts</h2>
            <button onClick={onClose} style={{ padding: 5, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
              className="hover:bg-muted">
              <X size={14} style={{ color: 'hsl(var(--text-meta))' }} />
            </button>
          </div>

          <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SHORTCUTS.map(({ keys, desc }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 13, color: 'hsl(var(--text-body))' }}>{desc}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  {keys.map((k, j) => (
                    <React.Fragment key={k}>
                      <span className="kbd">{k}</span>
                      {j < keys.length - 1 && <span style={{ fontSize: 10, color: 'hsl(var(--text-muted))' }}>+</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 20px 14px', borderTop: '1px solid hsl(var(--border))', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>
              Press <span className="kbd">?</span> to toggle this panel
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CheckSquare } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function SnapshotModal({ thread, onClose }) {
  const addSnapshot = useTaskStore(s => s.addSnapshot);
  const updateThreadStatus = useTaskStore(s => s.updateThreadStatus);
  const getLatestSnapshot = useTaskStore(s => s.getLatestSnapshot);
  const [lastAction, setLastAction] = useState('');
  const [nextOrBlocker, setNextOrBlocker] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [usePrevious, setUsePrevious] = useState(false);
  const f1 = useRef(null);
  const previousSnap = getLatestSnapshot(thread.id);

  useEffect(() => {
    const t = setTimeout(() => f1.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const hasTyped = lastAction.trim().length > 0 || nextOrBlocker.trim().length > 0;
  const canSave = usePrevious || lastAction.trim().length > 0;

  const handleSave = (targetStatus) => {
    if (!canSave || saving) return;
    setSaving(true);
    setTimeout(() => {
      if (usePrevious && previousSnap) {
        updateThreadStatus(thread.id, targetStatus);
      } else {
        addSnapshot(thread.id, { lastAction, nextStep: nextOrBlocker, blocker: null }, targetStatus);
      }
      setSaving(false);
      onClose();
    }, 100);
  };

  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave('paused');
  };

  const label = {
    fontSize: 12, fontWeight: 600,
    color: 'hsl(var(--text-body))',
    display: 'block', marginBottom: 6,
  };

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
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1.0, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '22px 24px 18px',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Zap size={12} strokeWidth={2.5} style={{ color: 'hsl(var(--primary))' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                  textTransform: 'uppercase', color: 'hsl(var(--primary))' }}>Snapshot</span>
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: 'hsl(var(--text-title))',
                lineHeight: 1.3, marginBottom: 4 }}>
                {thread.emoji && <span style={{ marginRight: 6 }}>{thread.emoji}</span>}
                {thread.title}
              </h2>
              <p style={{ fontSize: 12, color: 'hsl(var(--text-meta))' }}>
                Capture your context before you switch away
              </p>
            </div>
            <button onClick={onClose}
              style={{ padding: 6, borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'transparent', color: 'hsl(var(--text-meta))', flexShrink: 0 }}
              className="hover:bg-muted"
            ><X size={15} /></button>
          </div>

          {/* Fields */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {previousSnap && !hasTyped && (
              <button
                onClick={() => setUsePrevious(v => !v)}
                className={usePrevious ? 'btn-primary' : 'btn-ghost'}
                style={{ alignSelf: 'flex-start', height: 30 }}
              >
                <CheckSquare size={12} /> {usePrevious ? 'Using previous snapshot' : 'Use previous snapshot'}
              </button>
            )}
            {usePrevious && previousSnap ? (
              <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: 12, background: 'hsl(var(--surface-raised))' }}>
                <p style={{ fontSize: 11, color: 'hsl(var(--text-meta))', marginBottom: 6 }}>Previous snapshot will be reused. No extra note will be added.</p>
                <p style={{ fontSize: 13, color: 'hsl(var(--text-title))', lineHeight: 1.5 }}>{previousSnap.lastAction || previousSnap.note}</p>
              </div>
            ) : (
              <>
                <div>
                  <label style={label}>
                    Capture your context - what you were doing, next steps, or blockers
                    <span style={{ color: 'hsl(var(--destructive))', marginLeft: 2 }}>*</span>
                  </label>
                  <textarea ref={f1} className="snap-textarea" rows={3}
                    placeholder="e.g. Traced the bug to the JWT expiry handler... next step is to update the expiry window."
                    value={lastAction} onChange={e => setLastAction(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Tab') { e.preventDefault(); document.getElementById('sn-next-blocker')?.focus(); }
                      else handleKey(e);
                    }}
                  />
                </div>
                <div>
                  <label style={label}>
                    What's Next / What's Blocked?
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'hsl(var(--text-meta))', marginLeft: 4 }}>(optional)</span>
                  </label>
                  <textarea id="sn-next-blocker" className="snap-textarea" rows={2}
                    placeholder="e.g. Waiting on DevOps to rotate the signing key..."
                    value={nextOrBlocker} onChange={e => setNextOrBlocker(e.target.value)}
                    onKeyDown={handleKey}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 24px',
              borderTop: '1px solid hsl(var(--border))',
            }}
          >
            <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>
              <span className="kbd">Cmd</span> <span className="kbd">Enter</span> to save
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <button
                onClick={() => handleSave('stuck')}
                disabled={!canSave || saving}
                className="btn-outline-amber"
                style={{ height: 32, fontSize: 13, padding: '0 18px', opacity: canSave ? 1 : 0.42 }}
              >
                🚫 Stuck
              </button>
              <button
                onClick={() => handleSave('paused')}
                disabled={!canSave || saving}
                className="btn-primary"
                style={{ height: 32, fontSize: 13, padding: '0 18px', opacity: canSave ? 1 : 0.42 }}
              >
                {saving ? 'Saving…' : '⏸ Pause'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

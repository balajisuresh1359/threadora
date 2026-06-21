import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { getTrackColor } from '../utils/trackColors';

function StatusBadge({ status }) {
  const cfg = {
    active: { label: 'Active', cls: 'status-badge-active' },
    paused: { label: 'Parked', cls: 'status-badge-paused' },
    stuck:  { label: 'Parked', cls: 'status-badge-paused' },
    delayed:{ label: 'Parked', cls: 'status-badge-paused' },
    closed: { label: 'Closed', cls: 'status-badge-closed' },
  };
  const c = cfg[status] ?? cfg.active;
  return <span className={`status-badge ${c.cls}`}><span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}}/>{c.label}</span>;
}

export function TrackDrawer({ track, onClose, onHighlightThread, onOpenDetailDrawer }) {
  const threads  = useTaskStore(s => s.threads);

  const trackThreads = threads
    .filter(t => t.track?.toLowerCase() === track?.toLowerCase() && t.status !== 'closed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const grouped = {
    active: trackThreads.filter(t => t.status === 'active'),
    parked: trackThreads.filter(t => t.status === 'paused' || t.status === 'stuck' || t.status === 'delayed'),
  };

  const color = getTrackColor(track);

  return (
    <AnimatePresence>
      <motion.div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* Backdrop */}
        <div className="drawer-overlay" onClick={onClose} />

        {/* Panel */}
        <motion.div
          className="drawer-panel"
          style={{ width: 360 }}
          initial={{ x: 360 }}
          animate={{ x: 0 }}
          exit={{ x: 360 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid hsl(var(--border))',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--text-title))' }}>{track}</h2>
              </div>
              <button
                onClick={onClose}
                style={{ padding: 6, border: 'none', background: 'transparent', borderRadius: 6 }}
                className="hover:bg-muted"
              >
                <X size={15} style={{ color: 'hsl(var(--text-meta))' }} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'hsl(var(--text-meta))' }}>
              {trackThreads.length} thread{trackThreads.length !== 1 ? 's' : ''} in this track
            </p>
          </div>

          {/* Groups */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {(['active','parked']).map(status => {
              const list = grouped[status];
              if (!list.length) return null;
              const labels = { active: 'Active', parked: 'Parked' };
              return (
                <div key={status} style={{ marginBottom: 16 }}>
                  <div style={{
                    padding: '4px 20px 6px',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'hsl(var(--text-muted))',
                  }}>
                    {labels[status]}
                  </div>
                  {list.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { 
                          onClose();
                          window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: t.status === 'active' ? 'active' : 'parked' }));
                          onHighlightThread(t.id);
                          onOpenDetailDrawer(t);
                        }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center',
                          gap: 12, padding: '8px 20px', textAlign: 'left',
                          border: 'none', background: 'transparent',
                          transition: 'background 120ms',
                        }}
                        className="hover:bg-muted"
                      >
                        {t.emoji && <span style={{ fontSize: 14, flexShrink: 0 }}>{t.emoji}</span>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 13, fontWeight: 500, color: 'hsl(var(--text-title))',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{t.title}</p>
                        </div>
                        <StatusBadge status={t.status} />
                      </button>
                  ))}
                </div>
              );
            })}

            {trackThreads.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--text-meta))', fontSize: 13 }}>
                No threads in this track yet.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function StuckButton({ threadId, small = false }) {
  const updateThreadStatus = useTaskStore(s => s.updateThreadStatus);
  const setStuckReason = useTaskStore(s => s.setStuckReason);
  const [showPopover, setShowPopover] = useState(false);
  const [reason, setReason] = useState('');

  const handleMarkStuck = () => {
    if (reason.trim()) {
      setStuckReason(threadId, reason.trim());
    }
    updateThreadStatus(threadId, 'stuck');
    setShowPopover(false);
    setReason('');
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowPopover(!showPopover)}
        className="btn-outline-amber"
        style={small ? { height: 26, fontSize: 11, padding: '0 8px' } : {}}
        type="button"
      >
        <AlertTriangle size={small ? 11 : 12} />
        Stuck
      </button>

      {showPopover && (
        <>
          <div onClick={() => setShowPopover(false)} style={{ position: 'fixed', inset: 0, zIndex: 29 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30,
            background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))',
            borderRadius: '8px', boxShadow: 'var(--shadow-dropdown)',
            padding: 12, minWidth: 260,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-title))', marginBottom: 8 }}>
              Mark as Stuck
            </div>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder="What's blocking you? (optional)"
              style={{
                width: '100%', minHeight: 60, padding: '8px 10px', fontSize: 12,
                border: '1px solid hsl(var(--border))', borderRadius: '6px',
                background: 'hsl(var(--surface-raised))', color: 'hsl(var(--text-title))',
                fontFamily: 'Inter, sans-serif', resize: 'none',
              }}
              onKeyDown={e => { if (e.key === 'Escape') { setShowPopover(false); setReason(''); } }}
            />
            <button onClick={handleMarkStuck} className="btn-outline-amber"
              style={{ width: '100%', marginTop: 8 }}
            >
              <AlertTriangle size={12} />
              Mark Stuck
            </button>
          </div>
        </>
      )}
    </div>
  );
}

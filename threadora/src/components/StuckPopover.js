import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function StuckPopover({ isOpen, threadId, onClose }) {
  const updateThreadStatus = useTaskStore(s => s.updateThreadStatus);
  const setStuckReason = useTaskStore(s => s.setStuckReason);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleMarkStuck = () => {
    if (reason.trim()) {
      setStuckReason(threadId, reason.trim());
    }
    updateThreadStatus(threadId, 'stuck');
    onClose();
    setReason('');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 29,
        }}
      />

      {/* Popover */}
      <div className="timer-quick-popover" style={{ minWidth: 240 }}>
        <div style={{ padding: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-title))', marginBottom: 8 }}>
            Mark as Stuck
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="What's blocking you? (optional)"
            style={{
              width: '100%',
              minHeight: 60,
              padding: '8px 10px',
              fontSize: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--surface-raised))',
              color: 'hsl(var(--text-title))',
              fontFamily: 'Inter, sans-serif',
              resize: 'none',
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') { onClose(); setReason(''); }
            }}
          />
          <button
            onClick={handleMarkStuck}
            className="btn-outline-amber"
            style={{ width: '100%', marginTop: 8 }}
          >
            <AlertTriangle size={12} />
            Mark Stuck
          </button>
        </div>
      </div>
    </>
  );
}

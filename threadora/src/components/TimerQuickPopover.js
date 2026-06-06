import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';

const QUICK_OPTIONS = [
  { label: '25m', minutes: 25 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '90m', minutes: 90 },
];

export function TimerQuickPopover({ isOpen, onSetTimer, onClear, hasTimer, onClose }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customMins, setCustomMins] = useState('');

  if (!isOpen) return null;

  const handleQuick = (mins) => {
    onSetTimer(mins * 60);
    onClose();
  };

  const handleCustom = () => {
    const mins = parseInt(customMins, 10);
    if (mins > 0) {
      onSetTimer(mins * 60);
      onClose();
      setShowCustom(false);
      setCustomMins('');
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 29 }} />
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          zIndex: 30,
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-dropdown)',
          padding: 8,
          minWidth: 180,
        }}
      >
        {!showCustom ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUICK_OPTIONS.map(opt => (
              <button key={opt.label} onClick={() => handleQuick(opt.minutes)} type="button"
                style={{
                  padding: '6px 10px', fontSize: 12, fontWeight: 500, textAlign: 'left',
                  border: 'none', borderRadius: '6px', background: 'hsl(var(--muted))',
                  color: 'hsl(var(--text-title))', cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={e => e.target.style.background = 'hsl(var(--border))'}
                onMouseLeave={e => e.target.style.background = 'hsl(var(--muted))'}
              >
                <Clock size={12} style={{ marginRight: 6, display: 'inline' }} />
                {opt.label}
              </button>
            ))}
            <button onClick={() => setShowCustom(true)} type="button"
              style={{
                padding: '6px 10px', fontSize: 12, fontWeight: 500, textAlign: 'left',
                border: 'none', borderRadius: '6px', background: 'hsl(var(--muted))',
                color: 'hsl(var(--text-title))', cursor: 'pointer',
              }}
            >
              Custom...
            </button>
            {hasTimer && (
              <button onClick={() => { onClear(); onClose(); }} type="button"
                style={{
                  padding: '6px 10px', fontSize: 12, fontWeight: 500,
                  border: 'none', borderRadius: '6px',
                  background: 'transparent',
                  color: 'hsl(var(--text-meta))', cursor: 'pointer',
                }}
              >
                <X size={12} style={{ marginRight: 6, display: 'inline' }} />
                Clear Timer
              </button>
            )}
          </div>
        ) : (
          <div style={{ padding: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <input type="number" value={customMins} onChange={e => setCustomMins(e.target.value)}
                placeholder="Minutes" autoFocus
                style={{
                  flex: 1, padding: '6px 8px', fontSize: 12,
                  border: '1px solid hsl(var(--border))', borderRadius: '6px',
                  background: 'hsl(var(--surface-raised))', color: 'hsl(var(--text-title))',
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCustom();
                  if (e.key === 'Escape') { setShowCustom(false); setCustomMins(''); }
                }}
              />
            </div>
            <button onClick={handleCustom} className="btn-primary"
              disabled={!customMins || parseInt(customMins, 10) <= 0}
              style={{ width: '100%', height: 28, fontSize: 11 }}
            >
              Set Timer
            </button>
          </div>
        )}
      </div>
    </>
  );
}

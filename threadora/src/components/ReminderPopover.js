import React, { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

const QUICK = [
  { label: '15m', seconds: 15 * 60 },
  { label: '1h', seconds: 3600 },
  { label: '4h', seconds: 4 * 3600 },
  { label: '1d', seconds: 86400 },
];

export function ReminderPopover({ thread, onClose }) {
  const setReminder = useTaskStore(s => s.setReminder);
  const clearReminder = useTaskStore(s => s.clearReminder);
  const [custom, setCustom] = useState('');
  const [scale, setScale] = useState('hours');
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const apply = (seconds) => { setReminder(thread.id, seconds); onClose(); };

  const parse = (value, selectedScale, label) => {
    const trimmed = value.trim();
    if (!trimmed) return { ok: false, error: `${label} is empty.` };
    if (!/^\d+$/.test(trimmed)) return { ok: false, error: `${label} must be a whole number.` };
    const num = Number(trimmed);
    const max = selectedScale === 'days' ? 1000 : 10000;
    if (num < 1 || num > max) return { ok: false, error: `${label} limit is ${max} ${selectedScale}.` };
    const multiplier = selectedScale === 'days' ? 86400 : selectedScale === 'minutes' ? 60 : 3600;
    return { ok: true, seconds: num * multiplier };
  };

  const applyCustom = () => {
    const parsed = parse(custom, scale, 'Reminder');
    if (!parsed.ok) { setError(parsed.error); return; }
    apply(parsed.seconds);
  };

  return (
    <div
      ref={ref}
      className="reminder-popover"
      onClick={e => e.stopPropagation()}
    >
      <div className="reminder-popover-head">
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-title))'}}>
          Reminder
        </span>
        <button onClick={onClose} className="btn-ghost" style={{ height: 22, padding: '0 4px' }}>
          <X size={12} />
        </button>
      </div>

      <div className="reminder-quick-grid">
        {QUICK.map(q => (
          <button
            key={q.label}
            onClick={() => apply(q.seconds)}
            style={{
              flex: 1, padding: '5px 0', fontSize: '12px', fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border))',
              background: thread.reminderDuration === q.seconds
                ? 'hsl(var(--primary-subtle))'
                : 'hsl(var(--surface-raised))',
              color: thread.reminderDuration === q.seconds
                ? 'hsl(var(--primary))'
                : 'hsl(var(--text-body))',
              cursor: 'pointer',
            }}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="reminder-form-row">
        <input
          className="no-spinner"
          inputMode="numeric"
          placeholder="Custom"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyCustom()}
          style={{
            flex: 1, padding: '5px 8px', fontSize: '12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--surface-raised))',
            color: 'hsl(var(--text-title))',
            outline: 'none',
          }}
        />
        <select value={scale} onChange={e => setScale(e.target.value)} className="compact-select">
          <option value="minutes">mins</option>
          <option value="days">days</option>
          <option value="hours">hrs</option>
        </select>
        <button onClick={applyCustom} className="btn-primary reminder-set-btn">
          Set
        </button>
      </div>

      {error && <p style={{ margin: '0 0 8px', fontSize: 11, color: 'hsl(var(--destructive))' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 6 }}>
        {thread.reminderDuration && (
          <button onClick={() => { clearReminder(thread.id); onClose(); }} className="btn-ghost" style={{ flex: 1, height: 26, fontSize: 11 }}>Clear reminder</button>
        )}
      </div>
    </div>
  );
}

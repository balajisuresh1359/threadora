import React, { useState, useRef, useEffect } from 'react';
import { Clock, Bell, X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

const QUICK = [
  { label: '1d', seconds: 86400 },
  { label: '3d', seconds: 3 * 86400 },
  { label: '7d',  seconds: 7 * 86400 },
];

export function TimerPopover({ thread, onClose }) {
  const setTimer  = useTaskStore(s => s.setTimer);
  const clearTimer = useTaskStore(s => s.clearTimer);
  const setReminder = useTaskStore(s => s.setReminder);
  const clearReminder = useTaskStore(s => s.clearReminder);
  const [custom, setCustom] = useState('');
  const [scale, setScale] = useState('days');
  const [reminder, setReminderValue] = useState('');
  const [reminderScale, setReminderScale] = useState('hours');
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const apply = (seconds) => { setTimer(thread.id, seconds); onClose(); };

  const parse = (value, selectedScale, label) => {
    const trimmed = value.trim();
    if (!trimmed) return { ok: false, error: `${label} is empty.` };
    if (!/^\d+$/.test(trimmed)) return { ok: false, error: `${label} must be a whole number.` };
    const num = Number(trimmed);
    const max = selectedScale === 'days' ? 1000 : 10000;
    if (num < 1 || num > max) return { ok: false, error: `${label} limit is ${max} ${selectedScale}.` };
    return { ok: true, seconds: num * (selectedScale === 'days' ? 86400 : 3600) };
  };

  const applyCustom = () => {
    const parsed = parse(custom, scale, 'Timer');
    if (!parsed.ok) { setError(parsed.error); return; }
    apply(parsed.seconds);
  };

  const applyReminder = () => {
    const parsed = parse(reminder, reminderScale, 'Reminder');
    if (!parsed.ok) { setError(parsed.error); return; }
    setReminder(thread.id, parsed.seconds);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="timer-popover"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-title))'}}>
          Set focus timer
        </span>
        <button onClick={onClose} className="btn-ghost" style={{ height: 22, padding: '0 4px' }}>
          <X size={12} />
        </button>
      </div>

      {/* Quick options */}
      <div className="flex gap-1.5 mb-3">
        {QUICK.map(q => (
          <button
            key={q.label}
            onClick={() => apply(q.seconds)}
            style={{
              flex: 1, padding: '5px 0', fontSize: '12px', fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border))',
              background: thread.timerDuration === q.seconds
                ? 'hsl(var(--primary-subtle))'
                : 'hsl(var(--surface-raised))',
              color: thread.timerDuration === q.seconds
                ? 'hsl(var(--primary))'
                : 'hsl(var(--text-body))',
              cursor: 'pointer',
            }}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Custom */}
      <div className="flex gap-1.5 mb-3">
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
          <option value="days">days</option>
          <option value="hours">hrs</option>
        </select>
        <button
          onClick={applyCustom}
          className="btn-primary"
          style={{ height: 30, fontSize: 11 }}
        >
          Set
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <Bell size={12} style={{ color: 'hsl(var(--text-meta))' }} />
        <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>Reminder</span>
      </div>
      <div className="flex gap-1.5 mb-3">
        <input
          className="no-spinner"
          inputMode="numeric"
          placeholder="Optional"
          value={reminder}
          onChange={e => setReminderValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyReminder()}
          style={{
            flex: 1, padding: '5px 8px', fontSize: '12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--surface-raised))',
            color: 'hsl(var(--text-title))',
            outline: 'none',
          }}
        />
        <select value={reminderScale} onChange={e => setReminderScale(e.target.value)} className="compact-select">
          <option value="hours">hrs</option>
          <option value="days">days</option>
        </select>
        <button onClick={applyReminder} className="btn-primary" style={{ height: 30, fontSize: 11 }}>Set</button>
      </div>

      {error && <p style={{ margin: '0 0 8px', fontSize: 11, color: 'hsl(var(--destructive))' }}>{error}</p>}

      {/* Clear */}
      <div style={{ display: 'flex', gap: 6 }}>
        {thread.timerDuration && (
          <button onClick={() => { clearTimer(thread.id); onClose(); }} className="btn-ghost" style={{ flex: 1, height: 26, fontSize: 11 }}>Clear timer</button>
        )}
        {thread.reminderDuration && (
          <button onClick={() => { clearReminder(thread.id); onClose(); }} className="btn-ghost" style={{ flex: 1, height: 26, fontSize: 11 }}>Clear remind</button>
        )}
      </div>
    </div>
  );
}

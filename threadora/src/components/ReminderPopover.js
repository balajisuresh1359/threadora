import React, { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import * as chrono from 'chrono-node';

const QUICK = [
  { label: '30m', seconds: 30 * 60 },
  { label: '1h',  seconds: 3600 },
  { label: '2h',  seconds: 2 * 3600 },
  { label: '4h',  seconds: 4 * 3600 },
  { label: '1d',  seconds: 86400 },
  { label: '3d',  seconds: 3 * 86400 },
];

// Parse shorthand like "1m", "2h", "3d", "1w" into a Date
function parseShorthand(val) {
  const m = val.trim().match(/^(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const u = m[2][0].toLowerCase();
  const secs = u === 'm' ? n * 60 : u === 'h' ? n * 3600 : u === 'd' ? n * 86400 : u === 'w' ? n * 7 * 86400 : null;
  if (!secs) return null;
  return new Date(Date.now() + secs * 1000);
}

function parseReminderInput(val) {
  if (!val.trim()) return null;
  return parseShorthand(val) || chrono.parseDate(val);
}

export function ReminderPopover({ thread, onClose }) {
  const setReminder = useTaskStore(s => s.setReminder);
  const clearReminder = useTaskStore(s => s.clearReminder);
  
  const [inputText, setInputText] = useState(thread.reminderAbsoluteText || '');
  const [parsedDate, setParsedDate] = useState(null);
  const [manualDateTime, setManualDateTime] = useState('');
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [error, setError] = useState('');
  
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  useEffect(() => {
    if (thread.reminderAbsoluteAt) {
      setParsedDate(new Date(thread.reminderAbsoluteAt));
    }
  }, [thread.reminderAbsoluteAt]);

  const handleTextChange = (val) => {
    setInputText(val);
    setError('');
    if (!val.trim()) {
      setParsedDate(null);
      setShowManualFallback(false);
      return;
    }
    const parsed = parseReminderInput(val);
    if (parsed) {
      setParsedDate(parsed);
      setShowManualFallback(false);
    } else {
      setParsedDate(null);
      setShowManualFallback(true);
    }
  };

  const handleManualDateTimeChange = (val) => {
    setManualDateTime(val);
    if (val) {
      setParsedDate(new Date(val));
    } else {
      setParsedDate(null);
    }
  };

  const apply = (seconds) => {
    const targetDate = new Date(Date.now() + seconds * 1000);
    setReminder(thread.id, seconds, targetDate.toISOString(), `${seconds / 60} minutes`);
    onClose();
  };

  const applyCustom = () => {
    const currentParsedDate = inputText.trim()
      ? parseReminderInput(inputText)
      : parsedDate;
    if (!currentParsedDate) {
      setError('Please enter a valid time or select manually.');
      return;
    }
    const seconds = Math.max(1, Math.round((currentParsedDate.getTime() - Date.now()) / 1000));
    setReminder(thread.id, seconds, currentParsedDate.toISOString(), inputText || 'Custom manual time');
    onClose();
  };

  const formatDatePreview = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div
      ref={ref}
      className="reminder-popover"
      onClick={e => e.stopPropagation()}
      style={{ minWidth: 260, padding: 12 }}
    >
      <div className="reminder-popover-head" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-title))'}}>
          Reminder
        </span>
        <button onClick={onClose} className="btn-ghost" style={{ height: 22, padding: '0 4px' }}>
          <X size={12} />
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))', marginBottom: 6 }}>Quick</div>
        <div className="reminder-quick-grid">
          {QUICK.map(q => (
            <button
              key={q.label}
              onClick={() => apply(q.seconds)}
              style={{
                flex: 1, padding: '5px 0', fontSize: '12px', fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--surface-raised))',
                color: 'hsl(var(--text-body))',
                cursor: 'pointer',
                minHeight: 30,
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))', marginBottom: 6 }}>Custom</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            placeholder="e.g. 2h, 3d, tomorrow 8pm, next Monday"
            value={inputText}
            onChange={e => handleTextChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyCustom()}
            style={{
              flex: 1, padding: '6px 8px', fontSize: '12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--surface-raised))',
              color: 'hsl(var(--text-title))',
              outline: 'none',
            }}
          />
          <button onClick={applyCustom} className="btn-primary" style={{ height: 30, padding: '0 12px', fontSize: 12 }}>
            Set
          </button>
        </div>

        {showManualFallback && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'hsl(var(--text-muted))' }}>Could not parse. Select date/time:</span>
            <input
              type="datetime-local"
              value={manualDateTime}
              onChange={e => handleManualDateTimeChange(e.target.value)}
              style={{
                width: '100%', padding: '5px 8px', fontSize: '12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--surface-raised))',
                color: 'hsl(var(--text-title))',
                outline: 'none',
              }}
            />
          </div>
        )}

        {parsedDate && (
          <div style={{ fontSize: 11, color: 'hsl(var(--status-active))', fontWeight: 500 }}>
            Reminds you: {formatDatePreview(parsedDate)}
          </div>
        )}
      </div>

      {error && <p style={{ margin: '0 0 8px', fontSize: 11, color: 'hsl(var(--destructive))' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 6 }}>
        {(thread.reminderDuration || thread.reminderAbsoluteAt) && (
          <button onClick={() => { clearReminder(thread.id); onClose(); }} className="btn-ghost" style={{ flex: 1, height: 26, fontSize: 11 }}>Clear reminder</button>
        )}
      </div>
    </div>
  );
}

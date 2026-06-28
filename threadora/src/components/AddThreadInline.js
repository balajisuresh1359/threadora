import React, { useState, useRef } from 'react';
import { Plus, Bell, Flag, Smile } from 'lucide-react';
import { useTaskStore, DEFAULT_PRIORITY, PRIORITY_OPTIONS } from '../store/useTaskStore';
import { TrackCombobox } from './TrackCombobox';
import { EmojiPicker } from './EmojiPicker';
import { getRandomWorkEmoji } from '../utils/emojis';
import * as chrono from 'chrono-node';

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


export function AddThreadInline({ onClose }) {
  const addThread     = useTaskStore(s => s.addThread);
  const customTracks  = useTaskStore(s => s.customTracks);
  const addCustomTrack = useTaskStore(s => s.addCustomTrack);
  const [title, setTitle]           = useState('');
  const [tracks, setTracks]         = useState(['Other']);
  const [emoji, setEmoji]           = useState(getRandomWorkEmoji());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [priority, setPriority]     = useState(String(DEFAULT_PRIORITY));
  const [reminderText, setReminderText] = useState('');
  const [reminderAbsoluteAt, setReminderAbsoluteAt] = useState(null);
  const [manualDateTime, setManualDateTime] = useState('');
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const initialEmojiRef = useRef(emoji);

  const hasDraft = touched || Boolean(
    title.trim() ||
    (tracks.length !== 1 || tracks[0] !== 'Other') ||
    emoji !== initialEmojiRef.current ||
    priority !== String(DEFAULT_PRIORITY) ||
    reminderText.trim()
  );

  const handlePanelBlur = event => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setTimeout(() => {
      const activeElement = document.activeElement;
      const focusIsInPanel = panelRef.current?.contains(activeElement);
      const focusIsInPopover = activeElement?.closest?.('[data-radix-popper-content-wrapper]');
      if (!focusIsInPanel && !focusIsInPopover && !hasDraft) onClose?.();
    }, 0);
  };

  const handleReminderChange = (val) => {
    setReminderText(val);
    setError('');
    if (!val.trim()) {
      setReminderAbsoluteAt(null);
      setShowManualFallback(false);
      return;
    }
    const shorthand = parseShorthand(val);
    if (shorthand) {
      setReminderAbsoluteAt(shorthand);
      setShowManualFallback(false);
      return;
    }
    const parsed = chrono.parseDate(val);
    if (parsed) {
      setReminderAbsoluteAt(parsed);
      setShowManualFallback(false);
    } else {
      setReminderAbsoluteAt(null);
      setShowManualFallback(true);
    }
  };

  const handleManualDateTimeChange = (val) => {
    setManualDateTime(val);
    if (val) {
      setReminderAbsoluteAt(new Date(val));
    } else {
      setReminderAbsoluteAt(null);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (!/^\d+$/.test(priority.trim())) {
      setError('Priority must be a whole number.');
      return;
    }
    let seconds = null;
    let absoluteAtStr = null;
    if (reminderAbsoluteAt) {
      seconds = Math.max(0, Math.round((reminderAbsoluteAt.getTime() - Date.now()) / 1000));
      absoluteAtStr = reminderAbsoluteAt.toISOString();
    }
    const result = addThread(title, tracks, {
      emoji,
      priorityValue: Number(priority),
      reminderDuration: seconds,
      reminderAbsoluteAt: absoluteAtStr,
      reminderAbsoluteText: reminderText || null,
    });
    if (result?.ok === false) {
      setError(result.error);
      return;
    }
    onClose && onClose();
  };

  const handleAddTrack = (name) => {
    if (!name.trim()) return;
    addCustomTrack(name);
    setTracks(prev => [...prev.filter(t => t !== 'Other'), name.trim()]);
  };

  return (
    <div
      ref={panelRef}
      onBlurCapture={handlePanelBlur}
      className="add-thread-panel"
      style={{
        borderRadius: 'var(--radius)', padding: '16px', marginBottom: 10,
        background: 'hsl(var(--surface))',
        border: '1.5px solid hsl(var(--border-strong))',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <input
        ref={inputRef}
        autoFocus
        className="add-input"
        placeholder="What are you working on?"
        value={title}
        onChange={e => { setTouched(true); setTitle(e.target.value); }}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') onClose && onClose();
        }}
        style={{ marginBottom: 12 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="add-thread-meta-row">
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setTouched(true); setShowEmojiPicker(v => !v); }} className="btn-ghost" style={{ height: 30, fontSize: 15, padding: '0 9px' }}>
              {emoji || <Smile size={13} />}
            </button>
            <EmojiPicker
              isOpen={showEmojiPicker}
              onSelect={nextEmoji => { setTouched(true); setEmoji(nextEmoji); }}
              onClose={() => setShowEmojiPicker(false)}
              fixed
            />
          </div>
          <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>Track</span>
          <TrackCombobox
            tracks={customTracks}
            value={tracks}
            onChange={(value) => { setTouched(true); setTracks(value); }}
            onCreateTrack={handleAddTrack}
            placeholder="Choose tracks"
            width={220}
          />
          <label className="add-thread-priority">
            <span><Flag size={12} /> Priority</span>
            <select value={priority} onChange={event => { setTouched(true); setPriority(event.target.value); }} className="compact-select">
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="add-thread-reminder-row" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'hsl(var(--text-body))', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
              <Bell size={13} /> Remind me
            </span>
            <input
              value={reminderText}
              onChange={e => { setTouched(true); handleReminderChange(e.target.value); }}
              placeholder="e.g. 2h, 1d, tomorrow 8pm"
              style={{ flex: 1, minWidth: 160, padding: '5px 9px', fontSize: 12, color: 'hsl(var(--text-title))', border: '1px solid hsl(var(--border-strong))', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--surface))', outline: 'none' }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') onClose && onClose();
              }}
            />
          </div>
          {showManualFallback && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 21 }}>
              <span style={{ fontSize: 10, color: 'hsl(var(--text-muted))' }}>Could not parse. Select date/time:</span>
              <input
                type="datetime-local"
                value={manualDateTime}
                onChange={e => { setTouched(true); handleManualDateTimeChange(e.target.value); }}
                style={{
                  padding: '5px 8px', fontSize: '12px',
                  border: '1px solid hsl(var(--border-strong))',
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--surface))',
                  color: 'hsl(var(--text-title))',
                  outline: 'none',
                }}
              />
            </div>
          )}
          {reminderAbsoluteAt && (
            <div style={{ fontSize: 11, color: 'hsl(var(--status-active))', fontWeight: 500, marginLeft: 21 }}>
              Reminds you: {reminderAbsoluteAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>
          )}
        </div>

        {error && <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--destructive))' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: 12, height: 28 }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="btn-primary"
            style={{ height: 28, fontSize: 12, opacity: title.trim() ? 1 : 0.45 }}
          >
            <Plus size={11} strokeWidth={2.5} /> Add Thread
          </button>
        </div>
      </div>
    </div>
  );
}

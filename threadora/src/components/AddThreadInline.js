import React, { useState, useRef } from 'react';
import { Plus, Bell, Flag, Smile } from 'lucide-react';
import { useTaskStore, DEFAULT_PRIORITY, PRIORITY_OPTIONS } from '../store/useTaskStore';
import { TrackCombobox } from './TrackCombobox';
import { EmojiPicker } from './EmojiPicker';
import { getRandomWorkEmoji } from '../utils/emojis';

export function AddThreadInline({ onClose }) {
  const addThread     = useTaskStore(s => s.addThread);
  const customTracks  = useTaskStore(s => s.customTracks);
  const addCustomTrack = useTaskStore(s => s.addCustomTrack);
  const [title, setTitle]           = useState('');
  const [track, setTrack]           = useState('Other');
  const [emoji, setEmoji]           = useState(getRandomWorkEmoji());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [priority, setPriority]     = useState(String(DEFAULT_PRIORITY));
  const [reminderValue, setReminderValue] = useState('');
  const [reminderScale, setReminderScale] = useState('hours');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const initialEmojiRef = useRef(emoji);

  const hasDraft = touched || Boolean(
    title.trim() ||
    track !== 'Other' ||
    emoji !== initialEmojiRef.current ||
    priority !== String(DEFAULT_PRIORITY) ||
    reminderValue.trim() ||
    reminderScale !== 'hours'
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

  const parseDuration = (value, scale, label) => {
    const trimmed = value.trim();
    if (!trimmed) return { ok: true, seconds: null };
    if (!/^\d+$/.test(trimmed)) return { ok: false, error: `${label} must be a whole number.` };
    const num = Number(trimmed);
    const max = scale === 'days' ? 1000 : 10000;
    if (num < 1 || num > max) return { ok: false, error: `${label} limit is ${max} ${scale}.` };
    const multiplier = scale === 'days' ? 86400 : scale === 'minutes' ? 60 : 3600;
    return { ok: true, seconds: num * multiplier };
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (!/^\d+$/.test(priority.trim())) {
      setError('Priority must be a whole number.');
      return;
    }
    const reminder = parseDuration(reminderValue, reminderScale, 'Reminder');
    if (!reminder.ok) { setError(reminder.error); return; }
    const result = addThread(title, track, {
      emoji,
      priorityValue: Number(priority),
      reminderDuration: reminder.seconds,
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
    setTrack(name.trim());
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
            value={track}
            onChange={(value) => { setTouched(true); setTrack(Array.isArray(value) ? (value[value.length - 1] || 'Other') : value); }}
            onCreateTrack={handleAddTrack}
            placeholder="Choose a track"
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

        <div className="add-thread-reminder-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'hsl(var(--text-body))', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
              <Bell size={13} /> Remind me in
            </span>
            <input
              className="no-spinner"
              inputMode="numeric"
              value={reminderValue}
              onChange={e => { setTouched(true); setReminderValue(e.target.value); }}
              placeholder="Optional"
              style={{ width: 76, padding: '5px 9px', fontSize: 12, color: 'hsl(var(--text-title))', border: '1px solid hsl(var(--border-strong))', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--surface))', outline: 'none' }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') onClose && onClose();
              }}
            />
            <select value={reminderScale} onChange={e => { setTouched(true); setReminderScale(e.target.value); }} className="compact-select">
              <option value="minutes">mins</option>
              <option value="hours">hrs</option>
              <option value="days">days</option>
            </select>
          </div>
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

import React, { useState, useRef } from 'react';
import { Plus, Clock, Bell, Hash, Smile, X } from 'lucide-react';
import { useTaskStore, DEFAULT_PRIORITY } from '../store/useTaskStore';
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
  const [timerValue, setTimerValue] = useState('');
  const [timerScale, setTimerScale] = useState('days');
  const [reminderValue, setReminderValue] = useState('');
  const [reminderScale, setReminderScale] = useState('hours');
  const [counterName, setCounterName] = useState('');
  const [counters, setCounters] = useState([]);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const parseDuration = (value, scale, label) => {
    const trimmed = value.trim();
    if (!trimmed) return { ok: true, seconds: null };
    if (!/^\d+$/.test(trimmed)) return { ok: false, error: `${label} must be a whole number.` };
    const num = Number(trimmed);
    const max = scale === 'days' ? 1000 : 10000;
    if (num < 1 || num > max) return { ok: false, error: `${label} limit is ${max} ${scale}.` };
    return { ok: true, seconds: num * (scale === 'days' ? 86400 : 3600) };
  };

  const addCounter = () => {
    const clean = counterName.trim().slice(0, 24);
    if (!clean) return;
    if (counters.length >= 5) {
      setError('You can add up to 5 counters per thread.');
      return;
    }
    setCounters(prev => [...prev, { id: `${Date.now()}-${clean}`, name: clean, value: 0 }]);
    setCounterName('');
    setError('');
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (!/^\d+$/.test(priority.trim())) {
      setError('Priority must be a whole number.');
      return;
    }
    const timer = parseDuration(timerValue, timerScale, 'Timer');
    if (!timer.ok) { setError(timer.error); return; }
    const reminder = parseDuration(reminderValue, reminderScale, 'Reminder');
    if (!reminder.ok) { setError(reminder.error); return; }
    const result = addThread(title, track, timer.seconds, {
      emoji,
      priorityValue: Number(priority),
      reminderDuration: reminder.seconds,
      counters,
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
      style={{
        borderRadius: 'var(--radius)', padding: '16px', marginBottom: 10,
        background: 'hsl(var(--primary-subtle))',
        border: '1.5px solid hsl(var(--primary) / 0.2)',
        boxShadow: '0 0 0 3px hsl(var(--primary) / 0.06)',
      }}
    >
      <input
        ref={inputRef}
        autoFocus
        className="add-input"
        placeholder="What are you working on?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') onClose && onClose();
        }}
        style={{ marginBottom: 12 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowEmojiPicker(v => !v)} className="btn-ghost" style={{ height: 30, fontSize: 15, padding: '0 9px' }}>
              {emoji || <Smile size={13} />}
            </button>
            <EmojiPicker
              isOpen={showEmojiPicker}
              onSelect={setEmoji}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
          <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>Track</span>
          <TrackCombobox
            tracks={customTracks}
            value={track}
            onChange={setTrack}
            onCreateTrack={handleAddTrack}
            placeholder="Choose a track"
            width={220}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'hsl(var(--text-meta))' }}>
            Priority
            <input
              className="no-spinner"
              inputMode="numeric"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              style={{ width: 76, padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border))', background: 'hsl(var(--surface))', color: 'hsl(var(--text-title))', outline: 'none' }}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={12} /> Timer
            </span>
            <input
              className="no-spinner"
              inputMode="numeric"
              value={timerValue}
              onChange={e => setTimerValue(e.target.value)}
              placeholder="Optional"
              style={{
                width: 70, padding: '3px 8px', fontSize: 12,
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--surface))',
                outline: 'none',
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') onClose && onClose();
              }}
            />
            <select value={timerScale} onChange={e => setTimerScale(e.target.value)} className="compact-select">
              <option value="days">days</option>
              <option value="hours">hrs</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Bell size={12} /> Remind
            </span>
            <input
              className="no-spinner"
              inputMode="numeric"
              value={reminderValue}
              onChange={e => setReminderValue(e.target.value)}
              placeholder="Optional"
              style={{ width: 70, padding: '3px 8px', fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--surface))', outline: 'none' }}
            />
            <select value={reminderScale} onChange={e => setReminderScale(e.target.value)} className="compact-select">
              <option value="hours">hrs</option>
              <option value="days">days</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Hash size={12} /> Counters
          </span>
          {counters.map(counter => (
            <span key={counter.id} className="counter-chip">
              {counter.name}
              <button onClick={() => setCounters(prev => prev.filter(c => c.id !== counter.id))}><X size={10} /></button>
            </span>
          ))}
          {counters.length < 5 && (
            <>
              <input
                value={counterName}
                onChange={e => setCounterName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCounter(); } }}
                placeholder="Counter name"
                style={{ width: 130, padding: '4px 8px', fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--surface))', color: 'hsl(var(--text-title))', outline: 'none' }}
              />
              <button onClick={addCounter} className="btn-ghost" style={{ height: 28, fontSize: 11 }}>Add</button>
            </>
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

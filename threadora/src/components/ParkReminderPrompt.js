import React, { useState } from 'react';
import * as chrono from 'chrono-node';
import { Bell } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

const QUICK_REMINDERS = [
  { label: '30m', seconds: 30 * 60 },
  { label: '1h', seconds: 60 * 60 },
  { label: '1d', seconds: 24 * 60 * 60 },
  { label: '3d', seconds: 3 * 24 * 60 * 60 },
];

function parseReminderInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const shorthand = trimmed.match(/^(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)$/i);
  if (shorthand) {
    const amount = parseFloat(shorthand[1]);
    const unit = shorthand[2][0].toLowerCase();
    const seconds = unit === 'm'
      ? amount * 60
      : unit === 'h'
        ? amount * 3600
        : unit === 'd'
          ? amount * 86400
          : amount * 7 * 86400;
    return new Date(Date.now() + seconds * 1000);
  }
  return chrono.parseDate(trimmed);
}

export function hasActiveReminder(thread) {
  if (!thread || thread.reminderDue) return false;
  if (thread.reminderAbsoluteAt) {
    const dueAt = new Date(thread.reminderAbsoluteAt);
    return !Number.isNaN(dueAt.getTime()) && dueAt > new Date();
  }
  if (thread.reminderDuration && thread.reminderStartedAt) {
    const dueAt = new Date(new Date(thread.reminderStartedAt).getTime() + thread.reminderDuration * 1000);
    return !Number.isNaN(dueAt.getTime()) && dueAt > new Date();
  }
  return false;
}

export function ParkReminderPrompt({ thread, onSet, onSkip }) {
  const setReminder = useTaskStore(s => s.setReminder);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const saveReminder = (date, label) => {
    const seconds = Math.max(1, Math.round((date.getTime() - Date.now()) / 1000));
    setReminder(thread.id, seconds, date.toISOString(), label);
    onSet?.();
  };

  const applyQuick = seconds => {
    const dueAt = new Date(Date.now() + seconds * 1000);
    saveReminder(dueAt, `${seconds / 60} minutes`);
  };

  const applyInput = () => {
    const dueAt = parseReminderInput(input);
    if (!dueAt || Number.isNaN(dueAt.getTime())) {
      setError('Enter a reminder time or skip.');
      return;
    }
    saveReminder(dueAt, input.trim());
  };

  return (
    <div style={{
      border: '1px solid hsl(var(--border-strong))',
      background: 'hsl(var(--surface-raised))',
      borderRadius: 'var(--radius-md)',
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'hsl(var(--text-title))', fontSize: 12, fontWeight: 700 }}>
        <Bell size={12} /> Set a reminder to come back?
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
        {QUICK_REMINDERS.map(option => (
          <button key={option.label} type="button" className="btn-ghost" onClick={() => applyQuick(option.seconds)} style={{ height: 26, fontSize: 11 }}>
            {option.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={event => { setInput(event.target.value); setError(''); }}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applyInput();
            }
          }}
          placeholder="e.g. tomorrow 9am, 2d, next Monday"
          style={{
            flex: 1,
            minWidth: 0,
            height: 30,
            padding: '0 9px',
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 7,
            color: 'hsl(var(--text-title))',
            fontSize: 12,
            outline: 'none',
            fontFamily: 'var(--app-font), sans-serif',
          }}
        />
        <button type="button" className="btn-primary" onClick={applyInput} style={{ height: 30, fontSize: 12 }}>Set</button>
        <button type="button" className="btn-ghost" onClick={onSkip} style={{ height: 30, fontSize: 12 }}>Skip</button>
      </div>
      {error && <span style={{ fontSize: 11, color: 'hsl(var(--destructive))' }}>{error}</span>}
    </div>
  );
}

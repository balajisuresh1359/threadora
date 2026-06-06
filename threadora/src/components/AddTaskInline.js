import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

const TASK_TYPES = [
  { value: 'dev',    label: 'Dev' },
  { value: 'design', label: 'Design' },
  { value: 'comms',  label: 'Comms' },
  { value: 'other',  label: 'Other' },
];

export function AddTaskInline({ onClose }) {
  const addTask = useTaskStore(s => s.addTask);
  const [title, setTitle] = useState('');
  const [type, setType]   = useState('other');

  const handleSubmit = () => {
    if (!title.trim()) return;
    addTask(title, type);
    setTitle('');
    if (onClose) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose && onClose();
  };

  return (
    <div
      className="rounded-xl p-4 mb-2.5"
      style={{
        background: 'hsl(var(--primary-subtle))',
        border: '1.5px solid hsl(var(--primary) / 0.25)',
        boxShadow: '0 0 0 3px hsl(var(--primary) / 0.06)',
      }}
    >
      <input
        autoFocus
        className="add-task-input mb-3"
        placeholder="What are you working on?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Type chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginRight: 2 }}>Type</span>
          {TASK_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              style={{
                padding: '2px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: 500,
                border: type === t.value
                  ? '1px solid hsl(var(--primary))'
                  : '1px solid hsl(var(--border))',
                background: type === t.value
                  ? 'hsl(var(--primary))'
                  : 'hsl(var(--card))',
                color: type === t.value
                  ? 'white'
                  : 'hsl(var(--text-secondary))',
                cursor: 'pointer',
                transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            style={{
              height: '28px',
              padding: '0 12px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border))',
              background: 'transparent',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="btn-snapshot"
            style={{ height: '28px', opacity: title.trim() ? 1 : 0.4 }}
          >
            <Plus size={11} strokeWidth={2.5} />
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

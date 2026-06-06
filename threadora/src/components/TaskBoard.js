import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Archive } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { TaskCard } from './TaskCard';
import { AddTaskInline } from './AddTaskInline';
import { EmptyState } from './EmptyState';

export function TaskBoard({ onSnapshot }) {
  const tasks = useTaskStore(s => s.tasks);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const activeTasks = tasks
    .filter(t => !t.archivedAt)
    .sort((a, b) => a.priorityRank - b.priorityRank);

  const archivedTasks = tasks
    .filter(t => !!t.archivedAt)
    .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

  const filteredTasks = filter === 'all'
    ? activeTasks
    : activeTasks.filter(t => t.status === filter);

  // Arrow-key card navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, filteredTasks.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filteredTasks.length]);

  const FILTERS = [
    { id: 'all',     label: 'All' },
    { id: 'active',  label: 'Active' },
    { id: 'paused',  label: 'Paused' },
    { id: 'blocked', label: 'Blocked' },
  ];

  const counts = {
    all:     activeTasks.length,
    active:  activeTasks.filter(t => t.status === 'active').length,
    paused:  activeTasks.filter(t => t.status === 'paused').length,
    blocked: activeTasks.filter(t => t.status === 'blocked').length,
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">

      {/* ── Board header ────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="leading-tight mb-1"
            style={{ fontSize: '22px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}
          >
            Your Tasks
          </h1>
          <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
            {activeTasks.length === 0
              ? 'Nothing here yet - add your first task.'
              : `${counts.active} active · ${counts.paused} paused · ${counts.blocked} blocked`
            }
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="btn-snapshot flex-shrink-0"
          style={{ height: '34px', paddingLeft: '14px', paddingRight: '14px' }}
        >
          <Plus size={13} strokeWidth={2.5} />
          Add Task
        </button>
      </div>

      {/* ── Filter tabs ────────────────────────────────── */}
      {activeTasks.length > 0 && (
        <div
          className="flex items-center gap-0.5 mb-5 w-fit p-1 rounded-lg"
          style={{
            background: 'hsl(var(--surface-raised))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                border: filter === f.id ? '1px solid hsl(var(--border))' : '1px solid transparent',
                background: filter === f.id ? 'hsl(var(--card))' : 'transparent',
                color: filter === f.id ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
                boxShadow: filter === f.id ? 'var(--shadow-card-rest)' : 'none',
                transition: 'background 120ms ease, color 120ms ease',
              }}
            >
              {f.label}
              {counts[f.id] > 0 && (
                <span
                  style={{
                    marginLeft: 5,
                    fontSize: '10px',
                    color: filter === f.id ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                  }}
                >
                  {counts[f.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Add task inline form ─────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <AddTaskInline onClose={() => setShowAdd(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Task list ──────────────────────────────────── */}
      {filteredTasks.length === 0 && !showAdd ? (
        <EmptyState onAddTask={() => setShowAdd(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                rank={task.priorityRank}
                onSnapshot={onSnapshot}
                isFocused={focusedIndex === i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Archive section ─────────────────────────────── */}
      {archivedTasks.length > 0 && (
        <div className="mt-12">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-2 mb-3"
            style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <Archive size={12} strokeWidth={2} />
            <span style={{ fontWeight: 500 }}>
              {showArchived ? 'Hide' : 'Show'} archived ({archivedTasks.length})
            </span>
          </button>

          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                {archivedTasks.map(task => (
                  <div
                    key={task.id}
                    className="task-card"
                    style={{ opacity: 0.45, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span
                      style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', textDecoration: 'line-through' }}
                      className="truncate"
                    >
                      {task.title}
                    </span>
                    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginLeft: 12, flexShrink: 0 }}>
                      {task.type}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

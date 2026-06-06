import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, closestCenter, PointerSensor,
  KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Plus, Archive, RotateCcw, ChevronDown, ChevronUp, SortAsc, X } from 'lucide-react';
import { useTaskStore, getTimerRemaining } from '../store/useTaskStore';
import { ThreadCard } from './ThreadCard';
import { AddThreadInline } from './AddThreadInline';
import { EmptyState } from './EmptyState';

// Custom tab creator
function CustomTabCreator({ onAdd, onClose }) {
  const [label, setLabel] = useState('');
  const [statuses, setStatuses] = useState(['active']);
  const ALL_STATUSES = ['active', 'paused', 'stuck'];

  const toggle = (s) => setStatuses(prev =>
    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
  );

  return (
    <div
      style={{
        background: 'hsl(var(--surface))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius)',
        padding: 14, marginTop: 8,
        boxShadow: 'var(--shadow-dropdown)',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-title))', marginBottom: 8 }}>New custom tab</p>
      <input
        autoFocus
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Tab name"
        style={{
          width: '100%', padding: '7px 10px', fontSize: 13,
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-sm)',
          background: 'hsl(var(--surface-raised))',
          color: 'hsl(var(--text-title))',
          outline: 'none', marginBottom: 10,
        }}
        onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
      />
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => toggle(s)}
            style={{
              padding: '3px 10px', borderRadius: 'var(--radius-pill)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: statuses.includes(s)
                ? '1.5px solid hsl(var(--primary))'
                : '1px solid hsl(var(--border))',
              background: statuses.includes(s) ? 'hsl(var(--primary-subtle))' : 'transparent',
              color: statuses.includes(s) ? 'hsl(var(--primary))' : 'hsl(var(--text-body))',
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => { if (label.trim() && statuses.length > 0) { onAdd(label, statuses); onClose(); } }}
          disabled={!label.trim() || statuses.length === 0}
          className="btn-primary"
          style={{ height: 28, fontSize: 12 }}
        >
          Create tab
        </button>
        <button onClick={onClose} className="btn-ghost" style={{ height: 28, fontSize: 12 }}>Cancel</button>
      </div>
    </div>
  );
}

export function Workspace({ onSnapshot, onOpenTrackDrawer, onOpenDetailDrawer, focusedIndex, highlightId }) {
  const threads      = useTaskStore(s => s.threads);
  const reorderThreads = useTaskStore(s => s.reorderThreads);
  const reopenThread = useTaskStore(s => s.reopenThread);

  const [activeTab,    setActiveTab]    = useState('all');
  const [showAdd,      setShowAdd]      = useState(false);
  const [showClosed,   setShowClosed]   = useState(false);
  const [sortByTimer,  setSortByTimer]  = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openThreads  = threads.filter(t => t.status !== 'closed').sort((a, b) => a.priorityRank - b.priorityRank);
  const closedThreads = threads.filter(t => t.status === 'closed').sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));

  const counts = {
    all:    openThreads.length,
    active: openThreads.filter(t => t.status === 'active').length,
    paused: openThreads.filter(t => t.status === 'paused').length,
    stuck:  openThreads.filter(t => t.status === 'stuck').length,
  };

  // Get filtered threads
  const getFilteredThreads = (tabId) => {
    let list = openThreads;
    if (tabId === 'active') list = list.filter(t => t.status === 'active');
    else if (tabId === 'paused') list = list.filter(t => t.status === 'paused');
    else if (tabId === 'stuck')  list = list.filter(t => t.status === 'stuck');

    if (sortByTimer) {
      list = [...list].sort((a, b) => {
        if (a.timerOverdue && !b.timerOverdue) return -1;
        if (!a.timerOverdue && b.timerOverdue) return 1;
        const ra = getTimerRemaining(a), rb = getTimerRemaining(b);
        if (ra !== null && rb !== null) return ra - rb;
        if (ra !== null) return -1;
        if (rb !== null) return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    }

    return list;
  };

  const filteredThreads = getFilteredThreads(activeTab);

  // Compute top-3 priority ranks (only for active threads)
  const activeThreads = openThreads.filter(t => t.status === 'active');
  const top3Ids = new Set(activeThreads.slice(0, 3).map(t => t.id));

  // dnd-kit drag end
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = filteredThreads.findIndex(t => t.id === active.id);
    const newIdx = filteredThreads.findIndex(t => t.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const newFiltered = arrayMove(filteredThreads, oldIdx, newIdx);
    const filteredIds = new Set(filteredThreads.map(t => t.id));
    let fi = 0;
    const newFullOrder = openThreads.map(t => {
      if (filteredIds.has(t.id)) return newFiltered[fi++];
      return t;
    });
    reorderThreads(newFullOrder.map(t => t.id));
  };

  // Listen for tab switch events
  useEffect(() => {
    const handler = (e) => setActiveTab(e.detail);
    window.addEventListener('threadmark:switch-tab', handler);
    return () => window.removeEventListener('threadmark:switch-tab', handler);
  }, []);

  // Listen for new thread event
  useEffect(() => {
    const handler = () => setShowAdd(true);
    window.addEventListener('threadmark:new-thread', handler);
    return () => window.removeEventListener('threadmark:new-thread', handler);
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px', paddingTop: 32 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--text-title))', marginBottom: 4, lineHeight: 1.2 }}>
            Your Workspace
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--text-meta))' }}>
            {openThreads.length === 0
              ? 'Nothing here yet - start your first thread.'
              : `${counts.active} active · ${counts.paused} paused · ${counts.stuck} stuck`
            }
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Sort by timer */}
          {counts.active > 0 && (
            <button
              onClick={() => setSortByTimer(v => !v)}
              style={{
                height: 32, padding: '0 12px', fontSize: 12, fontWeight: 500,
                border: sortByTimer ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                borderRadius: 8,
                background: sortByTimer ? 'hsl(var(--primary-subtle))' : 'transparent',
                color: sortByTimer ? 'hsl(var(--primary))' : 'hsl(var(--text-meta))',
                display: 'flex', alignItems: 'center', gap: 6,
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              title="Sort by timer"
            >
              <SortAsc size={13} strokeWidth={2} />
              Timer sort
            </button>
          )}

          <button
            onClick={() => setShowAdd(v => !v)}
            className="btn-primary"
            style={{ height: 32, fontSize: 13 }}
          >
            <Plus size={13} strokeWidth={2.5} /> Add Thread
          </button>
        </div>
      </div>

      {/* ── Linear-style Tabs (underline only) ── */}
      {openThreads.length > 0 && (
        <div className="linear-tabs" key={`tabs-${activeTab}`}>
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'paused', label: 'Paused' },
            { id: 'stuck', label: 'Stuck' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`linear-tab ${activeTab === tab.id ? 'linear-tab-active' : ''}`}
            >
              {tab.label}
              <span className="linear-tab-count">{counts[tab.id]}</span>
            </button>
          ))}
        </div>
      )}
              borderRadius: 'var(--radius-md)',
              border: sortByTimer ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
              background: sortByTimer ? 'hsl(var(--primary-subtle))' : 'transparent',
              color: sortByTimer ? 'hsl(var(--primary))' : 'hsl(var(--text-meta))',
              display: 'flex', alignItems: 'center', gap: 5,
              cursor: 'pointer',
            }}
          >
            <SortAsc size={12} />
            Timer sort
          </button>

          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary"
            style={{ height: 32, fontSize: 13 }}
          >
            <Plus size={13} strokeWidth={2.5} /> Add Thread
          </button>
        </div>
      </div>

      {/* ── Linear-style Tabs (underline only) ── */}
      {openThreads.length > 0 && (
        <div className="linear-tabs" key={`tabs-${activeTab}`}>
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'paused', label: 'Paused' },
            { id: 'stuck', label: 'Stuck' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`linear-tab ${activeTab === tab.id ? 'linear-tab-active' : ''}`}
            >
              {tab.label}
              <span className="linear-tab-count">{counts[tab.id]}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Add thread ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <AddThreadInline onClose={() => setShowAdd(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Thread list ── */}
      {filteredThreads.length === 0 && !showAdd ? (
        <EmptyState tab={activeTab} onAddThread={() => setShowAdd(true)} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredThreads.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AnimatePresence mode="popLayout">
                {filteredThreads.map((thread, i) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    rank={thread.priorityRank}
                    isPriority={top3Ids.has(thread.id)}
                    onSnapshot={onSnapshot}
                    onOpenTrackDrawer={onOpenTrackDrawer}
                    onOpenDetailDrawer={onOpenDetailDrawer}
                    isFocused={focusedIndex === i}
                    highlightId={highlightId}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ── Closed threads section ── */}
      {closedThreads.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <button
            onClick={() => setShowClosed(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 500, color: 'hsl(var(--text-meta))',
              background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10,
            }}
          >
            <Archive size={12} />
            {showClosed ? 'Hide' : 'Show'} closed threads ({closedThreads.length})
            {showClosed ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          <AnimatePresence>
            {showClosed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {closedThreads.map(t => (
                  <div
                    key={t.id}
                    className="thread-card"
                    style={{ opacity: 0.55, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                  >
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.emoji && <span style={{ fontSize: 14 }}>{t.emoji}</span>}
                      <span style={{
                        fontSize: 13, color: 'hsl(var(--text-body))',
                        textDecoration: 'line-through',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {t.title}
                      </span>
                      <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))', flexShrink: 0 }}>{t.track}</span>
                    </div>
                    <button
                      onClick={() => reopenThread(t.id)}
                      className="btn-outline-indigo"
                      style={{ height: 26, fontSize: 11, flexShrink: 0 }}
                    >
                      <RotateCcw size={10} /> Reopen
                    </button>
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

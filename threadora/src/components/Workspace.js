import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, closestCenter, PointerSensor,
  KeyboardSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { LayoutDashboard, Plus, Search, Archive, ChevronDown, ChevronUp, Trash2, RotateCcw } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { getTrackColor } from '../utils/trackColors';
import { ThreadCard } from './ThreadCard';
import { AddThreadInline } from './AddThreadInline';
import { EmptyState } from './EmptyState';
import { TrackCombobox } from './TrackCombobox';

export function Workspace({ onSnapshot, onOpenTrackDrawer, onOpenDetailDrawer, focusedIndex, highlightId }) {
  const threads      = useTaskStore(s => s.threads);
  const reorderThreads = useTaskStore(s => s.reorderThreads);
  const reopenThread = useTaskStore(s => s.reopenThread);
  const deleteThread = useTaskStore(s => s.deleteThread);
  const snapshots = useTaskStore(s => s.snapshots);
  const customTracks = useTaskStore(s => s.customTracks);
  const settings = useTaskStore(s => s.settings);
  const updateSettings = useTaskStore(s => s.updateSettings);

  const [activeTab,    setActiveTab]    = useState('active');
  const [filterTrack,  setFilterTrack]  = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showAdd,      setShowAdd]      = useState(false);
  const [showClosed,   setShowClosed]   = useState(false);
  const [activeId,     setActiveId]     = useState(null);
  const [editingHeading, setEditingHeading] = useState(false);
  const [headingDraft, setHeadingDraft] = useState(settings.heading || 'Threads');
  const [hiddenTracks, setHiddenTracks] = useState([]);
  const [deleteClosedId, setDeleteClosedId] = useState(null);
  const [seenCounts, setSeenCounts] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openThreads  = threads.filter(t => t.status !== 'closed');
  const closedThreads = threads.filter(t => t.status === 'closed').sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));

  const counts = {
    all:    openThreads.length,
    active: openThreads.filter(t => t.status === 'active').length,
    paused: openThreads.filter(t => t.status === 'paused').length,
    stuck:  openThreads.filter(t => t.status === 'stuck').length,
    priority: openThreads.filter(t => t.priorityValue !== null && t.priorityValue !== undefined).length,
    delayed: openThreads.filter(t => t.status === 'delayed').length,
    nudges: openThreads.filter(t => t.reminderDue).length,
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'paused', label: 'Paused' },
    { id: 'stuck', label: 'Stuck' },
    { id: 'priority', label: 'Priority' },
    { id: 'delayed', label: 'Delayed' },
    { id: 'nudges', label: 'Nudges' },
  ];

  const crowdedTracks = customTracks
    .map(track => ({ track, count: openThreads.filter(t => t.track === track).length }))
    .filter(item => item.count >= 10);

  const getFilteredThreads = () => {
    let result = openThreads;
    if (activeTab === 'priority') {
      result = result.filter(t => t.priorityValue !== null && t.priorityValue !== undefined);
    } else if (activeTab === 'nudges') {
      result = result.filter(t => t.reminderDue);
    } else if (activeTab !== 'all') {
      result = result.filter(t => t.status === activeTab);
    } else if (hiddenTracks.length > 0) {
      result = result.filter(t => !hiddenTracks.includes(t.track));
    }
    if (filterTrack) {
      result = result.filter(t => t.track === filterTrack);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => {
        if (t.title.toLowerCase().includes(q)) return true;
        const snap = snapshots.find(s => s.threadId === t.id && (s.type === 'snapshot' || s.type === 'context_note'));
        if (snap && snap.lastAction && snap.lastAction.toLowerCase().includes(q)) return true;
        if (snap && snap.nextStep && snap.nextStep.toLowerCase().includes(q)) return true;
        if (snap && snap.blocker && snap.blocker.toLowerCase().includes(q)) return true;
        if (snap && snap.note && snap.note.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    result.sort((a, b) => {
      if (activeTab === 'priority') {
        return (a.priorityValue ?? 999999) - (b.priorityValue ?? 999999);
      }
      if (a.track !== b.track) {
        const idxA = customTracks.indexOf(a.track);
        const idxB = customTracks.indexOf(b.track);
        return (idxA > -1 ? idxA : 99) - (idxB > -1 ? idxB : 99);
      }
      return a.priorityRank - b.priorityRank;
    });

    return result;
  };

  const filteredThreads = getFilteredThreads();

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
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

  const handleDragCancel = () => {
    setActiveId(null);
  };

  useEffect(() => {
    setSeenCounts(prev => {
      const next = { ...prev };
      tabs.forEach(tab => {
        if (tab.id === 'all') return;
        if (next[tab.id] === undefined || tab.id === activeTab) next[tab.id] = counts[tab.id];
      });
      return next;
    });
  }, []);

  useEffect(() => {
    setSeenCounts(prev => ({ ...prev, [activeTab]: counts[activeTab] }));
  }, [activeTab, counts[activeTab]]);

  useEffect(() => {
    const handler = (e) => setActiveTab(e.detail);
    window.addEventListener('threadmark:switch-tab', handler);
    return () => window.removeEventListener('threadmark:switch-tab', handler);
  }, []);

  useEffect(() => {
    const handler = () => setShowAdd(true);
    window.addEventListener('threadmark:new-thread', handler);
    return () => window.removeEventListener('threadmark:new-thread', handler);
  }, []);

  const draggedThread = activeId ? threads.find(t => t.id === activeId) : null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px', paddingTop: 32 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'hsl(var(--text-title))', display: 'flex', alignItems: 'center', gap: 10 }}>
            <LayoutDashboard size={24} style={{ color: 'hsl(var(--primary))' }} />
            {editingHeading ? (
              <input
                autoFocus
                value={headingDraft}
                onChange={e => setHeadingDraft(e.target.value)}
                onBlur={() => {
                  const clean = headingDraft.trim() || 'Threads';
                  updateSettings({ heading: clean });
                  setHeadingDraft(clean);
                  setEditingHeading(false);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') { setHeadingDraft(settings.heading || 'Threads'); setEditingHeading(false); }
                }}
                style={{ width: 220, background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--text-title))', padding: '2px 8px', outline: 'none' }}
              />
            ) : (
              <button onClick={() => setEditingHeading(true)} style={{ font: 'inherit', color: 'inherit', background: 'transparent', border: 'none', padding: 0 }}>
                {settings.heading || 'Threads'}
              </button>
            )}
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--text-meta))', marginTop: 4 }}>
            {openThreads.length === 0
              ? 'Nothing here yet - start your first thread.'
              : `${counts.active} active · ${counts.paused} paused · ${counts.stuck} stuck`
            }
          </p>
        </div>

        <button
          onClick={() => setShowAdd(v => !v)}
          className="btn-primary"
          style={{ height: 32, fontSize: 13 }}
        >
          <Plus size={13} strokeWidth={2.5} /> Add Thread
        </button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-meta))' }} />
          <input
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', height: 36, paddingLeft: 32, borderRadius: 8,
              border: '1px solid hsl(var(--border))', background: 'transparent',
              fontSize: 13, color: 'hsl(var(--text-title))', outline: 'none'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>Track</span>
          <TrackCombobox
            tracks={customTracks}
            value={filterTrack}
            onChange={setFilterTrack}
            allLabel="All Tracks"
            placeholder="Filter by track"
            width={240}
          />
        </div>
      </div>

      {activeTab === 'all' && crowdedTracks.length > 0 && (
        <div className="soft-panel" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>Hide crowded types</span>
          {crowdedTracks.map(({ track, count }) => (
            <button
              key={track}
              onClick={() => setHiddenTracks(prev => prev.includes(track) ? prev.filter(t => t !== track) : [...prev, track])}
              className={hiddenTracks.includes(track) ? 'filter-chip active' : 'filter-chip'}
            >
              {track} {count}
            </button>
          ))}
        </div>
      )}

      <div className="linear-tabs" key={`tabs-${activeTab}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`linear-tab ${activeTab === tab.id ? 'linear-tab-active' : ''}`}
          >
            {tab.label}
            {tab.id !== 'all' && counts[tab.id] > (seenCounts[tab.id] ?? counts[tab.id]) && activeTab !== tab.id && (
              <span className="tab-glow-dot" />
            )}
            <span className="linear-tab-count">{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden', marginBottom: 16 }}
          >
            <AddThreadInline onClose={() => setShowAdd(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={filteredThreads.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div key={`list-${activeTab}`}>
            {filteredThreads.length === 0 ? (
              <EmptyState tab={activeTab} onAddThread={() => setShowAdd(true)} />
            ) : (
              filteredThreads.map((thread, i) => {
                const showHeader = i === 0 || filteredThreads[i-1].track !== thread.track;
                return (
                  <React.Fragment key={thread.id}>
                    {showHeader && (
                      <div style={{
                        padding: '16px 8px 8px', fontSize: 11, fontWeight: 700,
                        color: 'hsl(var(--text-title))', textTransform: 'uppercase', letterSpacing: '0.05em',
                        display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: getTrackColor(thread.track) }} />
                        {thread.track || 'Uncategorized'}
                      </div>
                    )}
                    <ThreadCard
                      thread={thread}
                      rank={thread.priorityRank}
                      isPriority={i < 3 && (activeTab === 'all' || activeTab === 'active')}
                      isFocused={i === focusedIndex}
                      highlightId={highlightId}
                      onSnapshot={onSnapshot}
                      onOpenTrackDrawer={onOpenTrackDrawer}
                      onOpenDetailDrawer={onOpenDetailDrawer}
                    />
                  </React.Fragment>
                );
              })
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {draggedThread ? (
            <div className="thread-card thread-card-dragging" style={{ cursor: 'grabbing' }}>
              <div style={{ opacity: 0.6 }}>Dragging: {draggedThread.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Closed threads toggle ── */}
      {closedThreads.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <button
            onClick={() => setShowClosed(v => !v)}
            className="btn-ghost"
            style={{ marginBottom: 12 }}
          >
            <Archive size={13} />
            {showClosed ? 'Hide' : 'Show'} Closed ({closedThreads.length})
            {showClosed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence>
            {showClosed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {closedThreads.map(thread => (
                  <div
                    key={thread.id}
                    style={{
                      padding: '12px 16px', marginBottom: 8,
                      background: 'hsl(var(--muted))', borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      opacity: 0.7,
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'hsl(var(--text-body))' }}>{thread.title}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => reopenThread(thread.id)}
                        className="btn-ghost"
                        style={{ height: 26, fontSize: 11 }}
                      >
                        <RotateCcw size={11} /> Reopen
                      </button>
                      <button
                        onClick={() => setDeleteClosedId(thread.id)}
                        className="btn-ghost hover:bg-red-500/10 hover:text-red-500"
                        style={{ height: 26, fontSize: 11, color: 'hsl(var(--text-meta))' }}
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                      {deleteClosedId === thread.id && (
                        <span className="inline-confirm" style={{ margin: 0, padding: '4px 6px' }}>
                          <span>Sure?</span>
                          <button onClick={() => deleteThread(thread.id)} className="btn-primary" style={{ height: 22, fontSize: 10, background: 'hsl(var(--destructive))' }}>Yes</button>
                          <button onClick={() => setDeleteClosedId(null)} className="btn-ghost" style={{ height: 22, fontSize: 10 }}>No</button>
                        </span>
                      )}
                    </div>
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

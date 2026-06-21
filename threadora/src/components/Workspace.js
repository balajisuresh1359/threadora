import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Plus, Search, Archive, ChevronDown, ChevronUp, Trash2, RotateCcw, Bell, CheckCircle2, ArrowUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../store/useTaskStore';
import { ThreadCard } from './ThreadCard';
import { AddThreadInline } from './AddThreadInline';
import { EmptyState } from './EmptyState';
import { TrackCombobox } from './TrackCombobox';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'parked', label: 'Parked' },
  { id: 'nudges', label: 'Reminders' },
];

const STATUS_FILTERS = {
  delayed: thread => thread.status === 'delayed' || Boolean(thread.reminderDue),
  ontime: thread => thread.status === 'active' && Boolean(thread.reminderDuration) && !thread.reminderDue,
  later: thread => thread.status === 'paused',
  stuck: thread => thread.status === 'stuck',
};

const isParkedThread = thread => thread.status === 'paused' || thread.status === 'stuck' || thread.status === 'delayed';

const compareDateDesc = (left, right, field) => new Date(right[field] || 0) - new Date(left[field] || 0);

export function Workspace({ onSnapshot, onOpenTrackDrawer, onOpenDetailDrawer, focusedIndex, highlightId }) {
  const threads      = useTaskStore(s => s.threads);
  const reorderThreads = useTaskStore(s => s.reorderThreads);
  const reopenThread = useTaskStore(s => s.reopenThread);
  const deleteThread = useTaskStore(s => s.deleteThread);
  const snapshots = useTaskStore(s => s.snapshots);
  const customTracks = useTaskStore(s => s.customTracks);
  const settings = useTaskStore(s => s.settings);
  const updateSettings = useTaskStore(s => s.updateSettings);
  const nudges = useTaskStore(s => s.nudges || []);
  const clearNudge = useTaskStore(s => s.clearNudge);
  const clearAllNudges = useTaskStore(s => s.clearAllNudges);

  const [activeTab,    setActiveTab]    = useState(() => {
    try {
      return localStorage.getItem('workspaceActiveTab') || 'active';
    } catch (e) {
      return 'active';
    }
  });
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterTracks, setFilterTracks] = useState([]);
  const [filterPriority, setFilterPriority] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortMode, setSortMode] = useState(settings.sortMode || 'createdAt');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showAdd,      setShowAdd]      = useState(false);
  const [showClosed,   setShowClosed]   = useState(false);
  const [editingHeading, setEditingHeading] = useState(false);
  const [headingDraft, setHeadingDraft] = useState(settings.heading || 'Threads');
  const [hiddenTracks, setHiddenTracks] = useState(() => {
    const trackCounts = {};
    threads.forEach(t => {
      if (t.status !== 'closed' && t.track) trackCounts[t.track] = (trackCounts[t.track] || 0) + 1;
    });
    return Object.keys(trackCounts).filter(k => trackCounts[k] >= 10);
  });
  const [deleteClosedId, setDeleteClosedId] = useState(null);
  const [seenCounts, setSeenCounts] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [pendingScrollId, setPendingScrollId] = useState(null);
  const tabsRef = useRef(null);
  const openThreads  = threads.filter(t => t.status !== 'closed');
  const closedThreads = threads.filter(t => t.status === 'closed').sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));

  const matchesSearch = thread => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    if (thread.title.toLowerCase().includes(query)) return true;
    return snapshots.some(snapshot => {
      if (snapshot.threadId !== thread.id) return false;
      return [snapshot.lastAction, snapshot.nextStep, snapshot.blocker, snapshot.note]
        .some(value => value?.toLowerCase().includes(query));
    });
  };

  const filteredForCounts = openThreads.filter(t => {
    if (filterPriority && (t.priorityValue ?? 1000) === 1000) return false;
    if (statusFilter && !STATUS_FILTERS[statusFilter]?.(t)) return false;
    if (filterTracks.length > 0 && !filterTracks.includes(t.track)) return false;
    if (!matchesSearch(t)) return false;
    return true;
  });

  const visibleNotifications = nudges.filter(notification => {
    if (notification.cleared) return false;
    const query = searchQuery.trim().toLowerCase();
    return !query || notification.title?.toLowerCase().includes(query);
  });

  const counts = {
    all:    filteredForCounts.length,
    active: filteredForCounts.filter(t => t.status === 'active').length,
    parked: filteredForCounts.filter(isParkedThread).length,
    nudges: visibleNotifications.length,
  };
  const activeCount = counts.active;
  const parkedCount = counts.parked;
  const nudgeCount = counts.nudges;

  const activeTabCount = counts[activeTab] ?? 0;

  const crowdedTracks = customTracks
    .map(track => ({ track, count: openThreads.filter(t => t.track === track).length }))
    .filter(item => item.count >= 10);

  const getFilteredThreads = () => {
    let result = filteredForCounts;
    
    if (activeTab === 'nudges') {
      result = [];
    } else if (activeTab === 'parked') {
      result = result.filter(isParkedThread);
    } else if (activeTab !== 'all') {
      result = result.filter(t => t.status === activeTab);
    } else if (hiddenTracks.length > 0) {
      result = result.filter(t => !hiddenTracks.includes(t.track));
    }
    result = [...result].sort((a, b) => {
      const aPinned = Boolean(a.isPinned);
      const bPinned = Boolean(b.isPinned);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      if (aPinned && bPinned) {
        return compareDateDesc(a, b, 'updatedAt');
      }
      if (sortMode === 'nearestCompletion') {
        const getRemaining = (t) => {
          if (t.reminderDue) return Infinity;
          if (!t.reminderDuration || !t.reminderStartedAt) return Infinity;
          const elapsed = Math.floor((Date.now() - new Date(t.reminderStartedAt).getTime()) / 1000);
          const remaining = t.reminderDuration - elapsed;
          return remaining > 0 ? remaining : 0;
        };
        const remA = getRemaining(a);
        const remB = getRemaining(b);
        if (remA !== remB) return remA - remB;
        return compareDateDesc(a, b, 'createdAt');
      }
      if (sortMode === 'name') {
        const byTitle = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        return byTitle || compareDateDesc(a, b, 'createdAt');
      }
      if (sortMode === 'updatedAt') return compareDateDesc(a, b, 'updatedAt');
      return compareDateDesc(a, b, 'createdAt');
    });

    return result;
  };

  const filteredThreads = getFilteredThreads();

  useEffect(() => {
    setSeenCounts(prev => {
      let changed = false;
      const next = { ...prev };
      TABS.forEach(tab => {
        if (tab.id === 'all') return;
        const nextValue = (
          tab.id === 'active' ? activeCount :
          tab.id === 'parked' ? parkedCount :
          nudgeCount
        );
        if (next[tab.id] === undefined || (tab.id === activeTab && next[tab.id] !== nextValue)) {
          next[tab.id] = nextValue;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [activeTab, activeCount, parkedCount, nudgeCount]);

  useEffect(() => {
    setSeenCounts(prev => (
      prev[activeTab] === activeTabCount
        ? prev
        : { ...prev, [activeTab]: activeTabCount }
    ));
  }, [activeTab, activeTabCount]);

  useEffect(() => {
    const handler = (e) => setActiveTab(e.detail);
    window.addEventListener('threadmark:switch-tab', handler);
    return () => window.removeEventListener('threadmark:switch-tab', handler);
  }, []);


  useEffect(() => {
    try {
      localStorage.setItem('workspaceActiveTab', activeTab);
    } catch (e) {
      // ignore
    }
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      const tabsRect = tabsRef.current?.getBoundingClientRect();
      const tabsAboveViewport = tabsRect ? tabsRect.bottom < 0 : false;
      setShowScrollTop(window.scrollY > 180 || tabsAboveViewport);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    updateSettings({ sortMode });
  }, [sortMode, updateSettings]);

  useEffect(() => {
    if (!pendingScrollId || activeTab === 'nudges') return;
    const timeout = setTimeout(() => {
      const node = document.querySelector(`[data-thread-id="${pendingScrollId}"]`);
      if (!node) return;
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      node.classList.add('thread-card-navigate-highlight');
      setTimeout(() => node.classList.remove('thread-card-navigate-highlight'), 1800);
      setPendingScrollId(null);
    }, 80);
    return () => clearTimeout(timeout);
  }, [pendingScrollId, activeTab, filteredThreads]);

  const openNotificationThread = notification => {
    const thread = threads.find(item => item.id === notification.threadId);
    if (!thread || thread.status === 'closed') return;
    setStatusFilter(null);
    setFilterTracks([]);
    setFilterPriority(false);
    setSearchQuery('');
    setActiveTab(thread.status === 'active' ? 'active' : 'parked');
    setPendingScrollId(thread.id);
    onOpenDetailDrawer?.(thread);
  };

  useEffect(() => {
    const handler = () => setShowAdd(true);
    window.addEventListener('threadmark:new-thread', handler);
    return () => window.removeEventListener('threadmark:new-thread', handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      document.getElementById('workspace-search')?.focus();
    };
    window.addEventListener('threadmark:focus-search', handler);
    return () => window.removeEventListener('threadmark:focus-search', handler);
  }, []);


  const hasActiveFilters =
    filterTracks.length > 0 ||
    filterPriority ||
    statusFilter !== null ||
    searchQuery.trim() !== '';
  return (
    <div className="workspace-shell">

      <div className="workspace-heading-row">
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
              : `${counts.active} active · ${counts.parked} parked`
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

      <div className="workspace-tools">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-meta))' }} />
          <input
            id="workspace-search"
            className={searchFocused ? 'workspace-search workspace-search-focused' : 'workspace-search'}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search titles, notes, blockers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="workspace-filterbar">
          <div className="workspace-track-filter">
            <span className="filter-label">Track</span>
            <TrackCombobox
              tracks={customTracks}
              value={filterTracks}
              onChange={setFilterTracks}
              allLabel="All Tracks"
              placeholder="Filter by track"
              width={220}
            />
            
          </div>
          <div className="workspace-status-filters">
            <button onClick={() => setFilterPriority(!filterPriority)} className={`filter-chip ${filterPriority ? 'active' : ''}`}>Priority</button>
            <button onClick={() => setStatusFilter(current => current === 'delayed' ? null : 'delayed')} className={`filter-chip ${statusFilter === 'delayed' ? 'active' : ''}`}>Delayed</button>
            <button onClick={() => setStatusFilter(current => current === 'ontime' ? null : 'ontime')} className={`filter-chip ${statusFilter === 'ontime' ? 'active' : ''}`}>On time</button>
            <button
              onClick={() => setStatusFilter(current => current === 'later' ? null : 'later')}
              className={`filter-chip ${statusFilter === 'later' ? 'active' : ''}`}
            >
              Later
            </button>
            <button
              onClick={() => setStatusFilter(current => current === 'stuck' ? null : 'stuck')}
              className={`filter-chip ${statusFilter === 'stuck' ? 'active' : ''}`}
            >
              Stuck
            </button>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className="filter-clear-btn"
              onClick={() => {
                setFilterTracks([]);
                setFilterPriority(false);
                setStatusFilter(null);
                setSearchQuery('');
                toast.success('All filters cleared');
              }}
              title="Clear all filters"
              aria-label="Clear all filters"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div className="workspace-sort-row">
          <label className="workspace-sort-control">
            <span className="filter-label">Sort</span>
            <select value={sortMode} onChange={event => setSortMode(event.target.value)} className="compact-select">
              <option value="createdAt">Created</option>
              <option value="updatedAt">Updated</option>
              <option value="name">Name</option>
              <option value="nearestCompletion">Nearest Completion</option>
            </select>
          </label>
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

      <div className="linear-tabs" key={`tabs-${activeTab}`} ref={tabsRef}>
        {TABS.map(tab => (
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

      <div key={`list-${activeTab}`}>
        {activeTab === 'nudges' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleNotifications.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                <button onClick={clearAllNudges} className="btn-ghost" style={{ height: 28 }}>
                  <CheckCircle2 size={12} /> Clear all
                </button>
              </div>
            )}
            {visibleNotifications.length === 0 ? (
              <EmptyState tab="nudges" onAddThread={() => setShowAdd(true)} />
            ) : visibleNotifications.slice().reverse().map(nudge => (
              <div key={nudge.id} className="thread-card notification-card" onClick={() => openNotificationThread(nudge)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'hsl(var(--text-title))', fontWeight: 700 }}>
                    <Bell size={13} style={{ color: 'hsl(var(--primary))' }} />
                    <span>{nudge.emoji} {nudge.title}</span>
                  </div>
                  <p style={{ margin: '4px 0 0 21px', fontSize: 12, color: 'hsl(var(--text-meta))' }}>
                    {nudge.message || 'You asked me to remind you'}
                  </p>
                </div>
                <button onClick={event => { event.stopPropagation(); clearNudge(nudge.id); }} className="btn-primary" style={{ height: 28, fontSize: 11 }}>
                  Clear
                </button>
              </div>
            ))}
          </div>
        ) : filteredThreads.length === 0 ? (
          <EmptyState tab={activeTab} onAddThread={() => setShowAdd(true)} />
        ) : (
          filteredThreads.map((thread, i) => {
            return (
              <React.Fragment key={thread.id}>
                <ThreadCard
                  thread={thread}
                  isPriority={i < 3 && (activeTab === 'all' || activeTab === 'active')}
                  isFocused={i === focusedIndex}
                  highlightId={highlightId}
                  onSnapshot={onSnapshot}
                  onOpenTrackDrawer={onOpenTrackDrawer}
                  onOpenDetailDrawer={onOpenDetailDrawer}
                  activeTab={activeTab}
                />
              </React.Fragment>
            );
          })
        )}
      </div>

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

      {showScrollTop && ( <button type="button" className="scroll-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" title="Back to top"> <ArrowUp size={16} /> </button> )}
    </div>
  );
}

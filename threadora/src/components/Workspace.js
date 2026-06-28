import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  { id: 'insights', label: 'Insights' },
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
  const [priorityExpanded, setPriorityExpanded] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const togglePriorityFilter = (val) => {
    setSelectedPriorities(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };
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
      if (t.status !== 'closed') {
        const trs = t.tracks || (t.track ? [t.track] : []);
        trs.forEach(tr => {
          trackCounts[tr] = (trackCounts[tr] || 0) + 1;
        });
      }
    });
    return Object.keys(trackCounts).filter(k => trackCounts[k] >= 10);
  });
  const [deleteClosedId, setDeleteClosedId] = useState(null);
  const [seenCounts, setSeenCounts] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [pendingScrollId, setPendingScrollId] = useState(null);
  const [resumeBannerDismissed, setResumeBannerDismissed] = useState(false);
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
    if (selectedPriorities.length > 0 && !selectedPriorities.includes(t.priorityValue ?? 1000)) return false;
    if (statusFilter && !STATUS_FILTERS[statusFilter]?.(t)) return false;
    if (filterTracks.length > 0 && !t.tracks?.some(tr => filterTracks.includes(tr))) return false;
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
    insights: null,
  };
  const activeCount = counts.active;
  const parkedCount = counts.parked;
  const nudgeCount = counts.nudges;

  const activeTabCount = counts[activeTab] ?? 0;

  const crowdedTracks = customTracks
    .map(track => ({ track, count: openThreads.filter(t => t.tracks?.includes(track)).length }))
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
      result = result.filter(t => !t.tracks?.some(tr => hiddenTracks.includes(tr)));
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

  const navigateToThread = useCallback((thread, openDetail = true) => {
    if (!thread || thread.status === 'closed') return;
    setStatusFilter(null);
    setFilterTracks([]);
    setSelectedPriorities([]);
    setPriorityExpanded(false);
    setSearchQuery('');
    setActiveTab(thread.status === 'active' ? 'active' : 'parked');
    setPendingScrollId(thread.id);
    if (openDetail) onOpenDetailDrawer?.(thread);
  }, [onOpenDetailDrawer]);

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
    const handler = (event) => {
      const id = event.detail?.id || event.detail;
      const thread = threads.find(item => item.id === id);
      navigateToThread(thread, event.detail?.openDetail !== false);
    };
    window.addEventListener('threadmark:navigate-thread', handler);
    return () => window.removeEventListener('threadmark:navigate-thread', handler);
  }, [threads, navigateToThread]);


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
    navigateToThread(thread);
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
    selectedPriorities.length > 0 ||
    statusFilter !== null ||
    searchQuery.trim() !== '';
  // T9: Top 1-3 resume candidates — sorted by most recent activity or nearest reminder
  const resumeCandidates = openThreads
    .filter(t => t.status !== 'closed')
    .sort((a, b) => {
      // Nearest reminder first, then most recently updated
      const aRem = a.reminderAbsoluteAt ? new Date(a.reminderAbsoluteAt).getTime() : Infinity;
      const bRem = b.reminderAbsoluteAt ? new Date(b.reminderAbsoluteAt).getTime() : Infinity;
      if (aRem !== bRem) return aRem - bRem;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    })
    .slice(0, 3);
  const showResumeBanner = !resumeBannerDismissed && resumeCandidates.length > 0;

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

      {/* T9: Resume-on-Open Banner */}
      {showResumeBanner && (
        <div style={{
          marginBottom: 16,
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border-strong))',
          borderRadius: 'var(--radius)',
          padding: '12px 14px',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>
              ↩ Pick up where you left off
            </span>
            <button
              onClick={() => setResumeBannerDismissed(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', padding: 4 }}
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {resumeCandidates.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'hsl(var(--text-body))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.emoji && <span style={{ marginRight: 6 }}>{t.emoji}</span>}
                  {t.title}
                </span>
                <button
                  onClick={() => onOpenDetailDrawer?.(t)}
                  style={{
                    flexShrink: 0, height: 26, padding: '0 10px', fontSize: 11,
                    background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600,
                  }}
                >
                  Resume →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {!priorityExpanded ? (
              <button onClick={() => setPriorityExpanded(true)} className={`filter-chip ${selectedPriorities.length > 0 ? 'active' : ''}`}>
                Priority {selectedPriorities.length > 0 ? `(${selectedPriorities.length})` : ''}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }} className="priority-sub-filters">
                <button onClick={() => setPriorityExpanded(false)} className={`filter-chip ${selectedPriorities.length > 0 ? 'active' : ''}`} style={{ fontWeight: '600' }}>
                  Priority ▸
                </button>
                <button onClick={() => togglePriorityFilter(100)} className={`filter-chip ${selectedPriorities.includes(100) ? 'active' : ''}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                  Urgent
                </button>
                <button onClick={() => togglePriorityFilter(250)} className={`filter-chip ${selectedPriorities.includes(250) ? 'active' : ''}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                  High
                </button>
                <button onClick={() => togglePriorityFilter(500)} className={`filter-chip ${selectedPriorities.includes(500) ? 'active' : ''}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                  Medium
                </button>
                <button onClick={() => togglePriorityFilter(1000)} className={`filter-chip ${selectedPriorities.includes(1000) ? 'active' : ''}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                  Low
                </button>
              </div>
            )}
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
                setSelectedPriorities([]);
                setPriorityExpanded(false);
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
            {counts[tab.id] != null && <span className="linear-tab-count">{counts[tab.id]}</span>}
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
                  <CheckCircle2 size={12} /> Dismiss all
                </button>
              </div>
            )}
            {visibleNotifications.length === 0 ? (
              <EmptyState tab="nudges" onAddThread={() => setShowAdd(true)} />
            ) : visibleNotifications.slice().reverse().map(nudge => {
              const nudgeThread = threads.find(t => t.id === nudge.threadId);
              const nudgeStatus = nudgeThread?.status || 'active';
              const isParkedNudge = nudgeStatus === 'paused' || nudgeStatus === 'stuck' || nudgeStatus === 'delayed';
              const isClosedNudge = nudgeStatus === 'closed';
              const primaryLabel = isClosedNudge ? 'View' : isParkedNudge ? 'Resume' : 'Open';
              const threadSnaps = snapshots.filter(s => s.threadId === nudge.threadId);
              let latestText = 'No notes yet';
              if (threadSnaps.length > 0) {
                const latest = threadSnaps.reduce((l, s) => new Date(s.capturedAt) > new Date(l.capturedAt) ? s : l);
                const rawText = latest.note || latest.lastAction || latest.nextStep || latest.blocker || '';
                if (rawText.trim()) {
                  latestText = rawText;
                  if (latestText.length > 120) {
                    latestText = latestText.slice(0, 120) + '...';
                  }
                }
              }
              return (
                <div key={nudge.id} className="thread-card notification-card" onClick={() => openNotificationThread(nudge)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'hsl(var(--text-title))', fontWeight: 700 }}>
                      <Bell size={13} style={{ color: 'hsl(var(--primary))' }} />
                      <span>{nudge.emoji} {nudge.title}</span>
                    </div>
                    <p style={{ margin: '4px 0 0 21px', fontSize: 12, color: 'hsl(var(--text-meta))' }}>
                      {latestText}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }} onClick={event => event.stopPropagation()}>
                    <button onClick={() => openNotificationThread(nudge)} className="btn-primary" style={{ height: 28, fontSize: 11 }}>
                      {primaryLabel}
                    </button>
                    <button onClick={() => clearNudge(nudge.id)} className="btn-ghost" style={{ height: 28, fontSize: 11 }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        ) : activeTab === 'insights' ? (
          (() => {
            const now = new Date();
            const DAY = 86400000;
            const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            const startOfDay = date => {
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              return d;
            };
            const getReminderDueAt = thread => {
              if (thread.reminderAbsoluteAt) return new Date(thread.reminderAbsoluteAt);
              if (thread.reminderDuration && thread.reminderStartedAt) {
                return new Date(new Date(thread.reminderStartedAt).getTime() + thread.reminderDuration * 1000);
              }
              return null;
            };
            const todayStart = startOfDay(now);
            const reminderBuckets = Array.from({ length: 7 }, (_, index) => {
              const day = new Date(todayStart);
              day.setDate(todayStart.getDate() + index);
              return {
                label: index === 0 ? 'Today' : WEEKDAYS[day.getDay()],
                date: day,
                count: 0,
              };
            });
            threads.forEach(thread => {
              if (thread.status === 'closed' || thread.reminderDue) return;
              const dueAt = getReminderDueAt(thread);
              if (!dueAt || Number.isNaN(dueAt.getTime()) || dueAt < now) return;
              const bucketIndex = Math.floor((startOfDay(dueAt) - todayStart) / DAY);
              if (bucketIndex >= 0 && bucketIndex < reminderBuckets.length) {
                reminderBuckets[bucketIndex].count += 1;
              }
            });
            const maxReminderBar = Math.max(...reminderBuckets.map(b => b.count), 1);

            // --- ACTIVITY ---
            const closedThisMonth = threads.filter(t => {
              if (t.status !== 'closed' || !t.closedAt) return false;
              const d = new Date(t.closedAt);
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length;
            const activeCount = threads.filter(t => t.status === 'active').length;
            const parkedCount = threads.filter(isParkedThread).length;
            const closedTotal = threads.filter(t => t.status === 'closed').length;

            // Closed by week (last 8 weeks)
            const weekBuckets = [];
            for (let i = 7; i >= 0; i--) {
              const wEnd = new Date(now); wEnd.setDate(now.getDate() - i * 7);
              const wStart = new Date(wEnd); wStart.setDate(wEnd.getDate() - 6);
              const cnt = threads.filter(t => {
                if (t.status !== 'closed' || !t.closedAt) return false;
                const d = new Date(t.closedAt);
                return d >= wStart && d <= wEnd;
              }).length;
              weekBuckets.push({ label: `W-${i}`, cnt });
            }
            const maxBar = Math.max(...weekBuckets.map(b => b.cnt), 1);

            // --- HEALTH ---
            // Parked > 7 days (live from actual threads)
            const parkedOver7 = threads.filter(t => {
              if (!isParkedThread(t)) return false;
              return new Date(t.updatedAt || t.createdAt).getTime() < Date.now() - 7 * DAY;
            }).length;
            // Threads with no snapshots
            const threadIdsWithSnap = new Set(snapshots.map(s => s.threadId));
            const noSnapshotCount = threads.filter(t => t.status !== 'closed' && !threadIdsWithSnap.has(t.id)).length;
            // Avg snapshots per thread
            const avgSnaps = threads.length > 0 ? (snapshots.length / threads.length).toFixed(1) : '0';
            // Longest parked thread
            const parkedThreads = threads.filter(isParkedThread);
            let longestParked = null, longestParkedDays = 0;
            parkedThreads.forEach(t => {
              const days = Math.floor((Date.now() - new Date(t.updatedAt || t.createdAt).getTime()) / DAY);
              if (days > longestParkedDays) { longestParkedDays = days; longestParked = t; }
            });
            // Avg time to park (creation → parked, only threads that ever got parked)
            const parkedWithTime = threads.filter(t => isParkedThread(t) && t.createdAt && t.updatedAt);
            let avgParkMs = 0;
            if (parkedWithTime.length > 0) {
              const totalMs = parkedWithTime.reduce((sum, t) => sum + (new Date(t.updatedAt) - new Date(t.createdAt)), 0);
              avgParkMs = totalMs / parkedWithTime.length;
            }
            const avgParkHrs = Math.round(avgParkMs / 3600000);
            const avgParkLabel = avgParkHrs > 48 ? `${Math.round(avgParkHrs / 24)}d` : avgParkHrs > 0 ? `${avgParkHrs}h` : '—';

            // --- PATTERNS ---
            // Most used track (live)
            const freq = {};
            threads.forEach(t => {
              (t.tracks || (t.track ? [t.track] : [])).forEach(tr => { freq[tr] = (freq[tr] || 0) + 1; });
            });
            let topTrack = 'None', topCount = 0;
            Object.entries(freq).forEach(([tr, c]) => { if (c > topCount) { topCount = c; topTrack = tr; } });
            // Busiest day of week (from createdAt)
            const dayCounts = [0,0,0,0,0,0,0];
            threads.forEach(t => { if (t.createdAt) dayCounts[new Date(t.createdAt).getDay()]++; });
            const busiestDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
            const busiestDay = threads.length > 0 ? WEEKDAYS[busiestDayIdx] : '—';
            // Status breakdown
            const statusBreakdown = [
              { label: 'Active', count: activeCount, color: 'hsl(var(--primary))' },
              { label: 'Paused', count: threads.filter(t => t.status === 'paused').length, color: 'hsl(45,90%,55%)' },
              { label: 'Stuck',  count: threads.filter(t => t.status === 'stuck').length,  color: 'hsl(0,70%,60%)' },
              { label: 'Closed', count: closedTotal, color: 'hsl(140,50%,50%)' },
            ];
            const totalStatus = Math.max(threads.length, 1);

            const SectionHeader = ({ children }) => (
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--text-muted))', marginBottom: 2, marginTop: 4 }}>{children}</div>
            );
            const Card = ({ icon, label, value, sub, color }) => (
              <div style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-strong))', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>{icon} {label}</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: color || 'hsl(var(--text-title))', lineHeight: 1.1 }}>{value}</span>
                {sub && <span style={{ fontSize: 11, color: 'hsl(var(--text-muted))' }}>{sub}</span>}
              </div>
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
                {/* ACTIVITY */}
                <div>
                  <SectionHeader>📊 Activity</SectionHeader>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 10 }}>
                    <Card icon="✅" label="Closed This Month" value={closedThisMonth} color="hsl(140,50%,50%)" />
                    <Card icon="🟢" label="Active" value={activeCount} color="hsl(var(--primary))" />
                    <Card icon="⏸" label="Parked" value={parkedCount} color="hsl(45,90%,55%)" />
                    <Card icon="🧵" label="Total Threads" value={threads.length} />
                  </div>
                  {/* Closed per week chart */}
                  <div style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-strong))', borderRadius: 'var(--radius)', padding: '14px 16px', marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))', marginBottom: 10 }}>📅 Closed / Week (last 8w)</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 60 }}>
                      {weekBuckets.map((b, idx) => (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                          <div title={`${b.cnt} closed`} style={{ width: '100%', background: b.cnt > 0 ? 'hsl(var(--primary))' : 'hsl(var(--border))', borderRadius: 3, height: `${Math.max((b.cnt / maxBar) * 48, b.cnt > 0 ? 6 : 3)}px`, transition: 'height 0.4s' }} />
                          <span style={{ fontSize: 8, color: 'hsl(var(--text-muted))' }}>{b.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-strong))', borderRadius: 'var(--radius)', padding: '14px 16px', marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))', marginBottom: 10 }}>Upcoming Reminders (next 7d)</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
                      {reminderBuckets.map(bucket => (
                        <div key={bucket.date.toISOString()} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: bucket.count > 0 ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))' }}>{bucket.count}</span>
                          <div title={`${bucket.count} reminders`} style={{ width: '100%', background: bucket.count > 0 ? 'hsl(var(--primary))' : 'hsl(var(--border))', borderRadius: 3, height: `${Math.max((bucket.count / maxReminderBar) * 42, bucket.count > 0 ? 7 : 3)}px`, transition: 'height 0.4s' }} />
                          <span style={{ fontSize: 8, color: 'hsl(var(--text-muted))' }}>{bucket.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Status breakdown */}
                  <div style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-strong))', borderRadius: 'var(--radius)', padding: '14px 16px', marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))', marginBottom: 10 }}>Status Distribution</div>
                    {statusBreakdown.map(s => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-title))', minWidth: 54 }}>{s.label}</span>
                        <div style={{ flex: 1, height: 7, background: 'hsl(var(--border))', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${(s.count / totalStatus) * 100}%`, height: '100%', background: s.color, borderRadius: 99, transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'hsl(var(--text-muted))', minWidth: 22, textAlign: 'right' }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HEALTH */}
                <div>
                  <SectionHeader>🩺 Health</SectionHeader>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 10 }}>
                    <Card icon="⏸" label="Parked > 7 Days" value={parkedOver7} color="hsl(45,90%,55%)" sub="stale parked threads" />
                    <Card icon="📸" label="Avg Snapshots" value={avgSnaps} sub="per thread" color="hsl(var(--primary))" />
                    <Card icon="⚠️" label="No Snapshots" value={noSnapshotCount} color="hsl(0,70%,60%)" sub="active w/ no context" />
                    <Card icon="🕐" label="Avg Time to Park" value={avgParkLabel} sub="creation → parked" />
                  </div>
                  {longestParked && (
                    <div style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-strong))', borderRadius: 'var(--radius)', padding: '12px 16px', marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))', marginBottom: 4 }}>🏆 Longest Parked Thread</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--text-title))' }}>{longestParked.emoji || '💬'} {longestParked.title.length > 48 ? longestParked.title.slice(0, 48) + '…' : longestParked.title}</div>
                      </div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'hsl(45,90%,55%)', whiteSpace: 'nowrap' }}>{longestParkedDays}d</span>
                    </div>
                  )}
                </div>

                {/* PATTERNS */}
                <div>
                  <SectionHeader>🔍 Patterns</SectionHeader>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 10 }}>
                    <Card icon="🏷" label="Most Used Track" value={topTrack !== 'None' ? (topTrack.length > 14 ? topTrack.slice(0,14)+'…' : topTrack) : '—'} sub={topCount > 0 ? `${topCount} threads` : ''} color="hsl(var(--primary))" />
                    <Card icon="📅" label="Busiest Day" value={busiestDay} sub={`most threads created`} />
                  </div>
                  {Object.keys(freq).length > 0 && (
                    <div style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-strong))', borderRadius: 'var(--radius)', padding: '14px 16px', marginTop: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))', marginBottom: 10 }}>🏷 Track Usage</div>
                      {Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,8).map(([tr, c]) => (
                        <div key={tr} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-title))', minWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tr}</span>
                          <div style={{ flex: 1, height: 6, background: 'hsl(var(--border))', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${(c / topCount) * 100}%`, height: '100%', background: 'hsl(var(--primary))', borderRadius: 99, transition: 'width 0.4s' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'hsl(var(--text-muted))', minWidth: 22, textAlign: 'right' }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Weekday distribution chart */}
                  <div style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border-strong))', borderRadius: 'var(--radius)', padding: '14px 16px', marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))', marginBottom: 10 }}>📅 Threads Created by Day</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 52 }}>
                      {WEEKDAYS.map((d, i) => {
                        const cnt = dayCounts[i];
                        const maxD = Math.max(...dayCounts, 1);
                        return (
                          <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                            <div title={`${cnt} threads`} style={{ width: '100%', borderRadius: 3, height: `${Math.max((cnt / maxD) * 40, cnt > 0 ? 5 : 2)}px`, background: i === busiestDayIdx ? 'hsl(var(--primary))' : 'hsl(var(--border-strong))', transition: 'height 0.4s' }} />
                            <span style={{ fontSize: 9, color: i === busiestDayIdx ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))', fontWeight: i === busiestDayIdx ? 700 : 400 }}>{d}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()

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
                  onNavigateToThread={navigateToThread}
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

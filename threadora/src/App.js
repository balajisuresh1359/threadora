import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HashRouter as BrowserRouter } from 'react-router-dom'

import { Toaster } from 'sonner';
import { Header } from './components/Header';
import { Workspace } from './components/Workspace';
import { SnapshotModal } from './components/SnapshotModal';
import { QuickSwitcher } from './components/QuickSwitcher';
import { TrackDrawer } from './components/TrackDrawer';
import { ThreadDetailDrawer } from './components/ThreadDetailDrawer';
import { ALL_CATS } from './components/EmptyState';
import { LIMIT_BOUNDS, getLimitSettings, useTaskStore } from './store/useTaskStore';
import './index.css';

function ThreadMarkApp() {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const threads = useTaskStore(s => s.threads);
  const updateThreadStatus = useTaskStore(s => s.updateThreadStatus);
  const settings = useTaskStore(s => s.settings);
  const updateSettings = useTaskStore(s => s.updateSettings);

  // Modal / drawer state
  const [snapshotThread,   setSnapshotThread]   = useState(null);
  const [showQuickSwitcher,setShowQuickSwitcher] = useState(false);
  const [trackDrawerTrack, setTrackDrawerTrack]  = useState(null);
  const [detailThread,     setDetailThread]      = useState(null);
  const [showShortcuts,    setShowShortcuts]     = useState(false);

  // Navigation state
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [highlightId,  setHighlightId]  = useState(null);

  // Active threads for navigation
  const openThreads = threads
    .filter(t => t.status !== 'closed')
    .sort((a, b) => a.priorityRank - b.priorityRank);
  const [FallbackCat] = useState(() => ALL_CATS[Math.floor(Math.random() * ALL_CATS.length)]);
  const limits = getLimitSettings(settings);
  const updateLimit = (key, value) => {
    const bounds = LIMIT_BOUNDS[key];
    const number = Math.min(bounds.max, Math.max(bounds.min, Math.round(Number(value) || bounds.default)));
    updateSettings({ limits: { ...limits, [key]: number } });
  };

  // Global keyboard shortcuts
  const handleGlobalKey = useCallback((e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    const tag = e.target.tagName;
    const inInput = tag === 'TEXTAREA' || tag === 'INPUT';

    // Cmd+S - snapshot first active
    if (isMeta && e.key === 's') {
      e.preventDefault();
      if (snapshotThread) return;
      const t = openThreads.find(t => t.status === 'active');
      if (t) setSnapshotThread(t);
      return;
    }
    // Cmd+K - quick switcher
    if (isMeta && e.key === 'k') { e.preventDefault(); setShowQuickSwitcher(v => !v); return; }
    // Escape
    if (e.key === 'Escape') {
      setSnapshotThread(null); setShowQuickSwitcher(false);
      setTrackDrawerTrack(null); setDetailThread(null); setShowShortcuts(false);
      return;
    }
    if (inInput) return;

    // / or F - focus search
    if (e.key === '/' || e.key.toLowerCase() === 'f') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('threadmark:focus-search'));
      return;
    }

    // N - new thread
    if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('threadmark:new-thread'));
      return;
    }

    // 1-5 - switch tabs
    if (e.key === '1') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'all' })); return; }
    if (e.key === '2') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'active' })); return; }
    if (e.key === '3') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'parked' })); return; }
    if (e.key === '4') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'nudges' })); return; }
    if (e.key === '5') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'insights' })); return; }

    // J / K - navigate
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(i => Math.min(i + 1, openThreads.length - 1));
      return;
    }
    if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(i => Math.max(i - 1, 0));
      return;
    }

    // R - resume focused
    if (e.key === 'r' && focusedIndex >= 0) {
      const t = openThreads[focusedIndex];
      if (t && (t.status === 'paused' || t.status === 'stuck' || t.status === 'delayed')) {
        updateThreadStatus(t.id, 'active');
      }
      return;
    }

    // B - park focused thread
    if (e.key === 'b' && focusedIndex >= 0) {
      const t = openThreads[focusedIndex];
      if (t && t.status === 'active') updateThreadStatus(t.id, 'stuck');
      return;
    }

    // Enter - expand focused (dispatch)
    if (e.key === 'Enter' && focusedIndex >= 0) {
      window.dispatchEvent(new CustomEvent('threadmark:expand', { detail: openThreads[focusedIndex]?.id }));
      return;
    }
  }, [openThreads, snapshotThread, focusedIndex, updateThreadStatus]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [handleGlobalKey]);

  useEffect(() => {
    const handleShowShortcuts = () => setShowShortcuts(true);
    window.addEventListener('threadmark:show-shortcuts', handleShowShortcuts);
    return () => window.removeEventListener('threadmark:show-shortcuts', handleShowShortcuts);
  }, []);

  // When track drawer navigates to a thread, highlight it briefly
  const handleHighlightThread = (id) => {
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 2000);
    // Scroll into view
    setTimeout(() => {
      document.querySelector(`[data-thread-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  if (dimensions.width < 320 || dimensions.height < 400) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 20, textAlign: 'center', background: 'hsl(var(--background))', color: 'hsl(var(--text-title))' }}>
        <div style={{ maxWidth: 340, width: '100%' }}>
          <div style={{ marginBottom: 24 }}>
            <FallbackCat />
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 650, lineHeight: 1.2 }}>Screen too small to render</h2>
          <p style={{ marginTop: 12, fontSize: 14, color: 'hsl(var(--text-meta))', lineHeight: 1.6 }}>
            Dimensions are too low to render. Resize the window or open this app in a larger window to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <Header />

      <main>
        <Workspace
          onSnapshot={(thread) => setSnapshotThread(thread)}
          onOpenTrackDrawer={(track) => setTrackDrawerTrack(track)}
          onOpenDetailDrawer={(thread) => setDetailThread(thread)}
          focusedIndex={focusedIndex}
          highlightId={highlightId}
        />
      </main>

      {/* Snapshot modal */}
      {snapshotThread && (
        <SnapshotModal
          thread={snapshotThread}
          onClose={() => setSnapshotThread(null)}
        />
      )}

      {/* Quick switcher */}
      {showQuickSwitcher && (
        <QuickSwitcher
          onClose={() => setShowQuickSwitcher(false)}
          onSnapshot={(t) => { setShowQuickSwitcher(false); setSnapshotThread(t); }}
        />
      )}


      {/* Track drawer */}
      {trackDrawerTrack && (
        <TrackDrawer
          track={trackDrawerTrack}
          onClose={() => setTrackDrawerTrack(null)}
          onHighlightThread={handleHighlightThread}
          onOpenDetailDrawer={setDetailThread}
        />
      )}

      {/* Thread detail drawer */}
      {detailThread && (
        <ThreadDetailDrawer
          thread={detailThread}
          onClose={() => setDetailThread(null)}
          onSnapshot={(t) => { setDetailThread(null); setSnapshotThread(t); }}
        />
      )}

      


      {showShortcuts && (
        <div className="shortcut-help-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcut-help-panel" onClick={event => event.stopPropagation()}>
            <div className="shortcut-help-head">
              <h2>Shortcuts & Limits</h2>
              <button type="button" className="btn-ghost" onClick={() => setShowShortcuts(false)}>Close</button>
            </div>
            <div className="shortcut-help-grid">
              <span><kbd className="kbd">N</kbd></span><p>New thread</p>
              <span><kbd className="kbd">/</kbd></span><p>Search</p>
              <span><kbd className="kbd">1</kbd> <kbd className="kbd">2</kbd> <kbd className="kbd">3</kbd> <kbd className="kbd">4</kbd> <kbd className="kbd">5</kbd></span><p>Switch tabs (5 = Insights)</p>
              <span><kbd className="kbd">J</kbd> <kbd className="kbd">K</kbd></span><p>Move focus</p>
              <span><kbd className="kbd">R</kbd></span><p>Resume focused thread</p>
              <span><kbd className="kbd">B</kbd></span><p>Park focused thread</p>
              <span><kbd className="kbd">⌘</kbd> <kbd className="kbd">S</kbd></span><p>Snapshot first active thread</p>
              <span><kbd className="kbd">⌘</kbd> <kbd className="kbd">K</kbd></span><p>Quick switcher</p>
            </div>
            <div className="config-help-section">
              <h3>Limits</h3>
              <label className="config-limit-row">
                <span>
                  Thread cap
                  <small>{threads.length} / {limits.threadCount} used, max {LIMIT_BOUNDS.threadCount.max}</small>
                </span>
                <input
                  type="number"
                  min={LIMIT_BOUNDS.threadCount.min}
                  max={LIMIT_BOUNDS.threadCount.max}
                  value={limits.threadCount}
                  onChange={event => updateLimit('threadCount', event.target.value)}
                />
              </label>
              <label className="config-limit-row">
                <span>
                  Thread size
                  <small>Per thread, max {LIMIT_BOUNDS.threadSizeKb.max} KB</small>
                </span>
                <input
                  type="number"
                  min={LIMIT_BOUNDS.threadSizeKb.min}
                  max={LIMIT_BOUNDS.threadSizeKb.max}
                  value={limits.threadSizeKb}
                  onChange={event => updateLimit('threadSizeKb', event.target.value)}
                />
              </label>
            </div>
            <div className="config-help-section">
              <h3>Display</h3>
              <label className="config-limit-row">
                <span>
                  Font style
                  <small>Applies globally across the app</small>
                </span>
                <select
                  value={settings.fontFamily || "'Courier New', monospace"}
                  onChange={e => updateSettings({ fontFamily: e.target.value })}
                  className="compact-select"
                  style={{ height: 32, fontSize: 12 }}
                >
                  <option value="Inter">Fresh</option>
                  <option value="Georgia, serif">Royal</option>
                  <option value="'Comic Sans MS', cursive">Happy</option>
                  <option value="system-ui, sans-serif">Simple</option>
                  <option value="Verdana, sans-serif">Bright</option>
                  <option value="Trebuchet MS, sans-serif">Chill</option>
                  <option value="Tahoma, sans-serif">Sharp</option>
                  <option value="'Courier New', monospace">Hacker</option>
                </select>
              </label>
              <label className="config-limit-row">
                <span>
                  Default sort
                  <small>How threads are ordered by default</small>
                </span>
                <select
                  value={settings.sortMode || 'createdAt'}
                  onChange={e => updateSettings({ sortMode: e.target.value })}
                  className="compact-select"
                  style={{ height: 32, fontSize: 12 }}
                >
                  <option value="createdAt">Created</option>
                  <option value="updatedAt">Updated</option>
                  <option value="name">Name</option>
                </select>
              </label>
              <label className="config-limit-row">
                <span>
                  Background Theme
                  <small>Applies to header and workspace</small>
                </span>
                <select
                  value={settings.bgTheme || 'default'}
                  onChange={e => updateSettings({ bgTheme: e.target.value })}
                  className="compact-select"
                  style={{ height: 32, fontSize: 12 }}
                >
                  <option value="default">Hacker Dark (Default)</option>
                  <option value="slate">Slate Dark</option>
                  <option value="ocean">Midnight Blue</option>
                  <option value="sage">Forest Green</option>
                  <option value="light-gray">Alabaster (Light)</option>
                  <option value="light-beige">Warm Sand (Light)</option>
                </select>
              </label>
              <label className="config-limit-row">
                <span>
                  Stuck Card Color
                  <small>Color for stuck cards</small>
                </span>
                <select
                  value={settings.stuckCardColor || 'active'}
                  onChange={e => updateSettings({ stuckCardColor: e.target.value })}
                  className="compact-select"
                  style={{ height: 32, fontSize: 12 }}
                >
                  <option value="active">Default (Same as Active)</option>
                  <option value="orange">Orange (Alert)</option>
                  <option value="red">Red</option>
                  <option value="purple">Purple</option>
                </select>
              </label>
              <label className="config-limit-row">
                <span>
                  Parked Card Color
                  <small>Color for paused/later cards</small>
                </span>
                <select
                  value={settings.parkedCardColor || 'active'}
                  onChange={e => updateSettings({ parkedCardColor: e.target.value })}
                  className="compact-select"
                  style={{ height: 32, fontSize: 12 }}
                >
                  <option value="active">Default (Same as Active)</option>
                  <option value="gray">Muted Gray</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 8, left: 48, fontSize: 10, color: 'hsl(var(--text-meta))', opacity: 0.7 }}>
        v2.0.0
      </div>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<ThreadMarkApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

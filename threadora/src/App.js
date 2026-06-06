import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Workspace } from './components/Workspace';
import { SnapshotModal } from './components/SnapshotModal';
import { QuickSwitcher } from './components/QuickSwitcher';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { TrackDrawer } from './components/TrackDrawer';
import { ThreadDetailDrawer } from './components/ThreadDetailDrawer';
import { useTaskStore } from './store/useTaskStore';
import './index.css';

// Rotating shortcut tips shown at bottom-center
const TIPS = [
  'Press J / K to navigate threads',
  'Press Cmd+S to snapshot the current thread',
  'Press Cmd+N to create a new thread',
  'Press 1–7 to switch between tabs',
  'Press R to resume a paused thread',
  'Press B to mark a thread as Stuck',
  'Press Enter to open a thread preview',
  'Press ? to see all shortcuts',
];

function ThreadMarkApp() {
  const threads = useTaskStore(s => s.threads);
  const updateThreadStatus = useTaskStore(s => s.updateThreadStatus);

  // Modal / drawer state
  const [snapshotThread,   setSnapshotThread]   = useState(null);
  const [showQuickSwitcher,setShowQuickSwitcher] = useState(false);
  const [showShortcuts,    setShowShortcuts]     = useState(false);
  const [trackDrawerTrack, setTrackDrawerTrack]  = useState(null);
  const [detailThread,     setDetailThread]      = useState(null);

  // Navigation state
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [activeTab,    setActiveTab]    = useState('all');
  const [highlightId,  setHighlightId]  = useState(null);

  // Shortcut tip
  const [tipIndex,     setTipIndex]     = useState(0);
  const [showTip,      setShowTip]      = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);

  // Show tip randomly with min 10-minute gap
  useEffect(() => {
    if (tipDismissed) return;
    const show = setTimeout(() => setShowTip(true), 3000);
    return () => clearTimeout(show);
  }, [tipDismissed]);

  useEffect(() => {
    if (!showTip || tipDismissed) return;
    const hide = setTimeout(() => {
      setShowTip(false);
      
      // Random gap between 10 and 30 minutes
      const minGap = 10 * 60 * 1000;
      const randomExtra = Math.random() * (20 * 60 * 1000);
      const nextDelay = minGap + randomExtra;
      
      const next = setTimeout(() => {
        setTipIndex(i => (i + 1) % TIPS.length);
        setShowTip(true);
      }, nextDelay);
      return () => clearTimeout(next);
    }, 6000); // Tip stays visible for 6 seconds
    return () => clearTimeout(hide);
  }, [showTip, tipDismissed, tipIndex]);

  // Active threads for navigation
  const openThreads = threads
    .filter(t => t.status !== 'closed')
    .sort((a, b) => a.priorityRank - b.priorityRank);

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
    // Cmd+N - new thread (handled by Workspace via setShowAdd - we dispatch a custom event)
    if (isMeta && e.key === 'n') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('threadmark:new-thread'));
      return;
    }
    // Escape
    if (e.key === 'Escape') {
      setSnapshotThread(null); setShowQuickSwitcher(false);
      setShowShortcuts(false); setTrackDrawerTrack(null); setDetailThread(null);
      return;
    }
    if (inInput) return;

    // ? - shortcuts panel
    if (e.key === '?') { setShowShortcuts(v => !v); return; }

    // 1-7 - switch tabs
    if (e.key === '1') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'all' })); return; }
    if (e.key === '2') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'active' })); return; }
    if (e.key === '3') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'paused' })); return; }
    if (e.key === '4') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'stuck' })); return; }
    if (e.key === '5') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'priority' })); return; }
    if (e.key === '6') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'delayed' })); return; }
    if (e.key === '7') { window.dispatchEvent(new CustomEvent('threadmark:switch-tab', { detail: 'nudges' })); return; }

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

    // B - mark stuck
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

  // When track drawer navigates to a thread, highlight it briefly
  const handleHighlightThread = (id) => {
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 2000);
    // Scroll into view
    setTimeout(() => {
      document.querySelector(`[data-thread-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <Header onShowShortcuts={() => setShowShortcuts(true)} />

      <main>
        <Workspace
          onSnapshot={(thread) => setSnapshotThread(thread)}
          onOpenTrackDrawer={(track) => setTrackDrawerTrack(track)}
          onOpenDetailDrawer={(thread) => setDetailThread(thread)}
          focusedIndex={focusedIndex}
          highlightId={highlightId}
        />
      </main>

      {/* "?" floating shortcut button */}
      <button
        onClick={() => setShowShortcuts(true)}
        style={{
          position: 'fixed', bottom: 20, right: 20,
          width: 32, height: 32, borderRadius: '50%',
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'hsl(var(--text-meta))',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
        }}
        title="Keyboard shortcuts (?)"
      >
        ?
      </button>

      {/* Rotating shortcut tip */}
      <AnimatePresence>
        {showTip && !tipDismissed && (
          <motion.div
            className="shortcut-tip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            onClick={() => setTipDismissed(true)}
          >
            Tip: {TIPS[tipIndex]}
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Keyboard shortcuts */}
      {showShortcuts && (
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
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

      {/* Thread detail drawer (paused/stuck) */}
      {detailThread && (
        <ThreadDetailDrawer
          thread={detailThread}
          onClose={() => setDetailThread(null)}
          onSnapshot={(t) => { setDetailThread(null); setSnapshotThread(t); }}
        />
      )}

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

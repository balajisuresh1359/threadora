import { create } from 'zustand';
import { getRandomWorkEmoji } from '../utils/emojis';

const STORAGE_KEY = 'threadmark_v2';
const TRACKS_KEY  = 'threadmark_tracks';
const TABS_KEY    = 'threadmark_custom_tabs';
const THEME_KEY   = 'threadmark_theme';
const SETTINGS_KEY = 'threadmark_settings';
export const DEFAULT_PRIORITY = 1000;
export const THREAD_CREATION_LIMIT = 300;
export const THREAD_BYTE_LIMIT = 25000;

// ── Storage helpers ───────────────────────────────────────────
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}
function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}
function normalizeCounters(counters) {
  return (Array.isArray(counters) ? counters : []).slice(0, 5).map(counter => ({
    id: counter.id || genId(),
    name: (counter.name || 'Counter').trim().slice(0, 24),
    value: Number.isFinite(Number(counter.value)) ? Number(counter.value) : 0,
  })).filter(counter => counter.name);
}
function normalizeThread(t) {
  return {
    activeStartedAt: null, emoji: null,
    timerDuration: null, timerStartedAt: null, timerElapsed: 0, timerOverdue: false,
    reminderDuration: null, reminderStartedAt: null, reminderDue: false,
    priorityValue: DEFAULT_PRIORITY,
    counters: [],
    closedAt: t.closedAt || t.archivedAt || null,
    ...t,
    track: t.track || t.type || 'other',
    status: t.status === 'blocked' ? 'stuck' : (t.status || 'active'),
    id: t.id,
    updatedAt: t.updatedAt || t.createdAt || new Date().toISOString(),
    priorityValue: t.priorityValue ?? t.priority ?? DEFAULT_PRIORITY,
    counters: normalizeCounters(t.counters),
  };
}
function getThreadBytes(thread, snapshots) {
  try {
    return new Blob([JSON.stringify({ thread, snapshots })]).size;
  } catch {
    return JSON.stringify({ thread, snapshots }).length;
  }
}

// ── Timer helpers ─────────────────────────────────────────────
export function getTimerElapsed(thread) {
  let elapsed = thread.timerElapsed || 0;
  if (thread.timerStartedAt && thread.status === 'active' && !thread.timerOverdue) {
    elapsed += Math.floor((Date.now() - new Date(thread.timerStartedAt).getTime()) / 1000);
  }
  return elapsed;
}
export function getTimerRemaining(thread) {
  if (!thread.timerDuration) return null;
  return Math.max(0, thread.timerDuration - getTimerElapsed(thread));
}
export function getReminderRemaining(thread) {
  if (!thread.reminderDuration || !thread.reminderStartedAt || thread.reminderDue) return null;
  const elapsed = Math.floor((Date.now() - new Date(thread.reminderStartedAt).getTime()) / 1000);
  return Math.max(0, thread.reminderDuration - elapsed);
}
export function formatTimer(seconds) {
  if (seconds === null || seconds === undefined) return '';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2,'0')}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2,'0')}s`;
  return `${s}s`;
}

// ── Migrate old data ──────────────────────────────────────────
function migrateData(raw) {
  if (!raw) return null;
  const threads = (raw.tasks || raw.threads || []).map(normalizeThread);
  const snapshots = (raw.snapshots || []).map(s => ({
    type: 'snapshot', edited: false, originalContent: null, note: null, targetStatus: null,
    ...s,
    threadId: s.threadId || s.taskId,
  }));
  return { threads, snapshots };
}

// ── Default tracks ────────────────────────────────────────────
const DEFAULT_TRACKS = ['Dev', 'Design', 'Research', 'Other'];

// ── Sample data ───────────────────────────────────────────────
const N = Date.now();
const SAMPLE_THREADS = [
  { id:'s1', title:'Redesign the onboarding flow', track:'Design', status:'active',
    createdAt:new Date(N-1000*60*94).toISOString(), updatedAt:new Date(N-1000*60*30).toISOString(), priorityRank:1, priorityValue:100, closedAt:null,
    activeStartedAt:new Date(N-1000*60*94).toISOString(), emoji:'🎨',
    timerDuration:null, timerStartedAt:null, timerElapsed:0, timerOverdue:false, reminderDuration:null, reminderStartedAt:null, reminderDue:false, counters:[] },
  { id:'s2', title:'Fix authentication bug in production', track:'Dev', status:'stuck',
    createdAt:new Date(N-1000*60*60*5).toISOString(), updatedAt:new Date(N-1000*60*45).toISOString(), priorityRank:2, priorityValue:250, closedAt:null,
    activeStartedAt:null, emoji:'🐛',
    timerDuration:null, timerStartedAt:null, timerElapsed:0, timerOverdue:false, reminderDuration:null, reminderStartedAt:null, reminderDue:false, counters:[] },
  { id:'s3', title:'Draft Q3 product roadmap email', track:'Comms', status:'paused',
    createdAt:new Date(N-1000*60*60*24).toISOString(), updatedAt:new Date(N-1000*60*60*3).toISOString(), priorityRank:3, priorityValue:1000, closedAt:null,
    activeStartedAt:null, emoji:null,
    timerDuration:null, timerStartedAt:null, timerElapsed:0, timerOverdue:false, reminderDuration:null, reminderStartedAt:null, reminderDue:false, counters:[] },
  { id:'s4', title:'Set up analytics dashboard', track:'Dev', status:'active',
    createdAt:new Date(N-1000*60*30).toISOString(), updatedAt:new Date(N-1000*60*30).toISOString(), priorityRank:4, priorityValue:1000, closedAt:null,
    activeStartedAt:new Date(N-1000*60*30).toISOString(), emoji:null,
    timerDuration:null, timerStartedAt:null, timerElapsed:0, timerOverdue:false, reminderDuration:null, reminderStartedAt:null, reminderDue:false, counters:[] },
];
const SAMPLE_SNAPSHOTS = [
  { id:'ss1', threadId:'s2', type:'snapshot', edited:false, originalContent:null, note:null,
    targetStatus:'stuck',
    lastAction:'Traced the bug to the JWT refresh token handler - token expiry mismatch.',
    nextStep:'Update expiry window in auth.config.ts and redeploy to staging.',
    blocker:'Need DevOps to rotate the signing secret first - waiting on Jay.',
    capturedAt:new Date(N-1000*60*35).toISOString() },
  { id:'ss2', threadId:'s3', type:'snapshot', edited:false, originalContent:null, note:null,
    targetStatus:'paused',
    lastAction:'Outlined the three main sections: wins, focus areas, and asks.',
    nextStep:'Write the "asks" section - need to be specific about design headcount.',
    blocker:null,
    capturedAt:new Date(N-1000*60*60*3).toISOString() },
];

// ── Init ──────────────────────────────────────────────────────
const storedRaw  = load(STORAGE_KEY);
const migrated   = migrateData(storedRaw);
const initThreads   = migrated?.threads   ?? SAMPLE_THREADS;
const initSnapshots = migrated?.snapshots ?? SAMPLE_SNAPSHOTS;

const storedTracks = load(TRACKS_KEY);
const initTracks = storedTracks ?? DEFAULT_TRACKS;

const storedTabs = load(TABS_KEY);
const initCustomTabs = storedTabs ?? [];

const storedTheme = load(THEME_KEY);
const initTheme = 'dark';
const storedSettings = load(SETTINGS_KEY);
const initSettings = {
  heading: 'Threads',
  fontFamily: 'Inter',
  ...storedSettings,
};

// ── Store ─────────────────────────────────────────────────────
export const useTaskStore = create((set, get) => ({
  threads:    initThreads,
  snapshots:  initSnapshots,
  customTracks: initTracks,
  customTabs:   initCustomTabs,
  theme:        initTheme,
  settings:     initSettings,

  _persist: (state) => {
    save(STORAGE_KEY, { threads: state.threads, snapshots: state.snapshots });
    save(TRACKS_KEY,  state.customTracks);
    save(TABS_KEY,    state.customTabs);
    save(THEME_KEY,   state.theme);
    save(SETTINGS_KEY, state.settings);
  },

  // ── Thread actions ─────────────────────────────────────────
  addThread: (title, track = 'Other', timerDuration = null, options = {}) => {
    const threads = get().threads;
    if (threads.length >= THREAD_CREATION_LIMIT) {
      return { ok: false, error: `Thread limit reached (${THREAD_CREATION_LIMIT}).` };
    }
    const maxRank = threads.length > 0 ? Math.max(...threads.map(t=>t.priorityRank)) : 0;
    const priorityValue = Number.isFinite(Number(options.priorityValue)) ? Number(options.priorityValue) : DEFAULT_PRIORITY;
    const now = new Date().toISOString();
    const t = {
      id: genId(), title: title.trim(), track, status: 'active',
      createdAt: now, updatedAt: now, priorityRank: maxRank + 1, priorityValue,
      closedAt: null, activeStartedAt: now,
      emoji: options.emoji || getRandomWorkEmoji(),
      timerDuration: timerDuration,
      timerStartedAt: timerDuration ? now : null,
      timerElapsed: 0, timerOverdue: false,
      reminderDuration: options.reminderDuration || null,
      reminderStartedAt: options.reminderDuration ? now : null,
      reminderDue: false,
      stuckReason: null,
      counters: normalizeCounters(options.counters),
    };
    set(state => {
      const next = { ...state, threads: [...state.threads, t] };
      get()._persist(next); return next;
    });
    return { ok: true, id: t.id };
  },

  updateThreadStatus: (id, status) => {
    set(state => {
      const threads = state.threads.map(t => {
        if (t.id !== id) return t;
        // Update timer state on status change
        let timerElapsed = t.timerElapsed || 0;
        let timerStartedAt = t.timerStartedAt;
        if (t.timerDuration && t.timerStartedAt && t.status === 'active') {
          // Pause the timer: capture elapsed
          timerElapsed += Math.floor((Date.now() - new Date(t.timerStartedAt).getTime()) / 1000);
          timerStartedAt = null;
        }
        if (status === 'active' && t.timerDuration && !t.timerOverdue) {
          // Resume the timer
          timerStartedAt = new Date().toISOString();
        }
        return {
          ...t, status, updatedAt: new Date().toISOString(),
          activeStartedAt: status === 'active' ? new Date().toISOString() : null,
          timerElapsed, timerStartedAt,
        };
      });
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  closeThread: (id) => {
    set(state => {
      const threads = state.threads.map(t =>
        t.id === id ? { ...t, status: 'closed', closedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), activeStartedAt: null } : t
      );
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  reopenThread: (id) => {
    set(state => {
      const threads = state.threads.map(t =>
        t.id === id ? { ...t, status: 'active', closedAt: null, updatedAt: new Date().toISOString(), activeStartedAt: new Date().toISOString() } : t
      );
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  deleteThread: (id) => {
    set(state => {
      const next = {
        ...state,
        threads: state.threads.filter(t => t.id !== id),
        snapshots: state.snapshots.filter(s => s.threadId !== id),
      };
      get()._persist(next); return next;
    });
  },

  updateThreadEmoji: (id, emoji) => {
    set(state => {
      const threads = state.threads.map(t => t.id === id ? { ...t, emoji, updatedAt: new Date().toISOString() } : t);
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  updateThreadTrack: (id, track) => {
    set(state => {
      const threads = state.threads.map(t => t.id === id ? { ...t, track, updatedAt: new Date().toISOString() } : t);
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  updateThreadPriority: (id, priorityValue = DEFAULT_PRIORITY) => {
    const value = Number.isFinite(Number(priorityValue)) ? Number(priorityValue) : DEFAULT_PRIORITY;
    set(state => {
      const threads = state.threads.map(t => t.id === id ? { ...t, priorityValue: value, updatedAt: new Date().toISOString() } : t);
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  addCounter: (id, name) => {
    const cleanName = name?.trim().slice(0, 24);
    if (!cleanName) return { ok: false, error: 'Counter name is required.' };
    let result = { ok: true };
    set(state => {
      const threads = state.threads.map(t => {
        if (t.id !== id) return t;
        const counters = normalizeCounters(t.counters);
        if (counters.length >= 5) {
          result = { ok: false, error: 'Maximum 5 counters per thread.' };
          return t;
        }
        return { ...t, counters: [...counters, { id: genId(), name: cleanName, value: 0 }], updatedAt: new Date().toISOString() };
      });
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
    return result;
  },

  updateCounter: (threadId, counterId, delta) => {
    set(state => {
      const threads = state.threads.map(t => t.id === threadId
        ? {
            ...t,
            counters: normalizeCounters(t.counters).map(c => c.id === counterId ? { ...c, value: c.value + delta } : c),
            updatedAt: new Date().toISOString(),
          }
        : t
      );
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  deleteCounter: (threadId, counterId) => {
    set(state => {
      const threads = state.threads.map(t => t.id === threadId
        ? { ...t, counters: normalizeCounters(t.counters).filter(c => c.id !== counterId), updatedAt: new Date().toISOString() }
        : t
      );
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  reorderThreads: (newIds) => {
    // newIds = array of all active (non-closed) thread ids in new order
    set(state => {
      const map = Object.fromEntries(state.threads.map(t => [t.id, t]));
      const reordered = newIds
        .filter(id => map[id])
        .map((id, i) => ({ ...map[id], priorityRank: i + 1 }));
      const untouched = state.threads.filter(t => !newIds.includes(t.id));
      const next = { ...state, threads: [...reordered, ...untouched] };
      get()._persist(next); return next;
    });
  },

  // ── Snapshot actions ───────────────────────────────────────
  addSnapshot: (threadId, { lastAction, nextStep, blocker }, targetStatus = 'paused') => {
    const snap = {
      id: genId(), threadId,
      lastAction: lastAction.trim(), nextStep: nextStep?.trim() || '',
      blocker: blocker?.trim() || null,
      capturedAt: new Date().toISOString(),
      type: 'snapshot', edited: false, originalContent: null, note: null, targetStatus,
    };
    set(state => {
      const threads = state.threads.map(t =>
        t.id === threadId
          ? { ...t, status: targetStatus, updatedAt: new Date().toISOString(), activeStartedAt: null }
          : t
      );
      const next = { ...state, snapshots: [...state.snapshots, snap], threads };
      get()._persist(next); return next;
    });
  },

  addContextNote: (threadId, note, phase) => {
    if (!note?.trim()) return { ok: false, error: 'Note is empty.' };
    const snap = {
      id: genId(), threadId,
      lastAction: '', nextStep: '', blocker: null,
      capturedAt: new Date().toISOString(),
      type: 'context_note', note: note.trim(), phase: phase, edited: false, originalContent: null, targetStatus: null,
    };
    const state = get();
    const thread = state.threads.find(t => t.id === threadId);
    const threadSnaps = state.snapshots.filter(s => s.threadId === threadId);
    if (thread && getThreadBytes(thread, [...threadSnaps, snap]) > THREAD_BYTE_LIMIT) {
      return { ok: false, error: 'Thread size limit reached. Export/archive older notes before adding more.' };
    }
    set(state => {
      const next = { ...state, snapshots: [...state.snapshots, snap] };
      get()._persist(next); return next;
    });
    return { ok: true };
  },

  editSnapshot: (snapId, updates) => {
    set(state => {
      const snapshots = state.snapshots.map(s => {
        if (s.id !== snapId) return s;
        return {
          ...s,
          ...updates,
          edited: true,
          editedAt: new Date().toISOString(),
          originalContent: s.originalContent || {
            lastAction: s.lastAction, nextStep: s.nextStep, blocker: s.blocker
          },
        };
      });
      const next = { ...state, snapshots };
      get()._persist(next); return next;
    });
  },

  restoreSnapshot: (snapId) => {
    set(state => {
      const snapshots = state.snapshots.map(s => {
        if (s.id !== snapId || !s.originalContent) return s;
        return {
          ...s,
          lastAction: s.originalContent.lastAction,
          nextStep: s.originalContent.nextStep,
          blocker: s.originalContent.blocker,
          edited: false, editedAt: null, originalContent: null,
        };
      });
      const next = { ...state, snapshots };
      get()._persist(next); return next;
    });
  },

  deleteSnapshot: (snapId) => {
    set(state => {
      const next = { ...state, snapshots: state.snapshots.filter(s => s.id !== snapId) };
      get()._persist(next); return next;
    });
  },

  getSnapshots: (threadId) => {
    return get().snapshots
      .filter(s => s.threadId === threadId)
      .sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt));
  },

  getLatestSnapshot: (threadId) => {
    const snaps = get().snapshots.filter(s => s.threadId === threadId && s.type === 'snapshot');
    if (!snaps.length) return null;
    return snaps.reduce((l, s) => new Date(s.capturedAt) > new Date(l.capturedAt) ? s : l);
  },

  // ── Timer actions ──────────────────────────────────────────
  setTimer: (threadId, durationSeconds) => {
    set(state => {
      const threads = state.threads.map(t => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          timerDuration: durationSeconds,
          timerStartedAt: t.status === 'active' ? new Date().toISOString() : null,
          timerElapsed: 0,
          timerOverdue: false,
        };
      });
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  clearTimer: (threadId) => {
    set(state => {
      const threads = state.threads.map(t =>
        t.id === threadId
          ? { ...t, timerDuration: null, timerStartedAt: null, timerElapsed: 0, timerOverdue: false }
          : t
      );
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  markTimerOverdue: (threadId) => {
    set(state => {
      const threads = state.threads.map(t =>
        t.id === threadId ? { ...t, status: 'delayed', timerOverdue: true, timerStartedAt: null, activeStartedAt: null, updatedAt: new Date().toISOString() } : t
      );
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  setReminder: (threadId, durationSeconds) => {
    set(state => {
      const threads = state.threads.map(t => t.id === threadId ? {
        ...t,
        reminderDuration: durationSeconds,
        reminderStartedAt: durationSeconds ? new Date().toISOString() : null,
        reminderDue: false,
        updatedAt: new Date().toISOString(),
      } : t);
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  clearReminder: (threadId) => {
    set(state => {
      const threads = state.threads.map(t => t.id === threadId ? {
        ...t,
        reminderDuration: null,
        reminderStartedAt: null,
        reminderDue: false,
        updatedAt: new Date().toISOString(),
      } : t);
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  markReminderDue: (threadId) => {
    set(state => {
      const threads = state.threads.map(t => t.id === threadId ? {
        ...t,
        reminderDue: true,
        updatedAt: new Date().toISOString(),
      } : t);
      const next = { ...state, threads };
      get()._persist(next); return next;
    });
  },

  acknowledgeReminder: (threadId) => {
    get().clearReminder(threadId);
  },

  // ── Track actions ──────────────────────────────────────────
  addCustomTrack: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set(state => {
      const customTracks = state.customTracks.includes(trimmed)
        ? state.customTracks
        : [...state.customTracks, trimmed];
      const next = { ...state, customTracks };
      get()._persist(next); return next;
    });
  },

  updateSettings: (updates) => {
    set(state => {
      const next = { ...state, settings: { ...state.settings, ...updates } };
      get()._persist(next); return next;
    });
  },

  // ── Theme actions ──────────────────────────────────────────
  // Removed theme toggling since it's dark mode only

  // ── Import / Export ────────────────────────────────────────
  importData: (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.threads && parsed.snapshots) {
        set(state => {
          const next = { ...state, threads: parsed.threads, snapshots: parsed.snapshots };
          get()._persist(next);
          return next;
        });
        return true;
      }
    } catch (e) {
      console.error("Failed to import JSON", e);
    }
    return false;
  },

  // ── Export ─────────────────────────────────────────────────
  exportData: () => {
    const { threads, snapshots } = get();
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), threads, snapshots }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `threadmark-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  },
}));

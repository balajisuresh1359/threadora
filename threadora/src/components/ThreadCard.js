import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, MoreHorizontal, Camera, Play, Ban,
  Timer, ChevronDown, ChevronUp, Edit2, Smile, Clock, ArrowRight,
  CheckCircle2, Trash2, Flag, Bell, Hash, X, Pencil,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
import { useTaskStore, getTimerRemaining, getReminderRemaining, formatTimer, DEFAULT_PRIORITY } from '../store/useTaskStore';
import { getTrackColor } from '../utils/trackColors';
import { getRelativeTime } from '../utils/timeUtils';
import { getSnapshotHandoff } from '../utils/snapshotUtils';
import { ResumeCard } from './ResumeCard';
import { EmojiPicker } from './EmojiPicker';
import { TimerPopover } from './TimerPopover';

// ─── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    active: { label: 'Active', cls: 'status-badge-active' },
    paused: { label: 'Paused', cls: 'status-badge-paused' },
    stuck:  { label: 'Stuck',  cls: 'status-badge-stuck' },
    delayed:{ label: 'Delayed', cls: 'status-badge-delayed' },
  };
  const c = cfg[status] ?? cfg.active;
  return (
    <span className={`status-badge ${c.cls}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

// ─── Focus (up-counter) or countdown timer ───────────────────────────────────
function FocusTimer({ thread }) {
  const markTimerOverdue = useTaskStore(s => s.markTimerOverdue);
  const [display, setDisplay] = useState('');
  const firedRef = useRef(false);

  useEffect(() => {
    if (!thread.activeStartedAt && !thread.timerDuration) return;

    const tick = () => {
      if (thread.timerDuration) {
        // Countdown mode
        const remaining = getTimerRemaining(thread);
        setDisplay(formatTimer(remaining));
        if (remaining === 0 && !thread.timerOverdue && !firedRef.current) {
          firedRef.current = true;
          markTimerOverdue(thread.id);
          toast.warning(`Time's up on "${thread.title}" - moved to Delayed.`, {
            action: { label: 'OK', onClick: () => {} }
          });
        }
      } else if (thread.activeStartedAt && thread.status === 'active') {
        // Up-counter: focus time
        const secs = Math.floor((Date.now() - new Date(thread.activeStartedAt).getTime()) / 1000);
        setDisplay(formatTimer(secs));
      }
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [thread.timerDuration, thread.timerStartedAt, thread.timerElapsed,
      thread.timerOverdue, thread.activeStartedAt, thread.status, markTimerOverdue, thread]);

  if (!display) return null;

  return (
    <span className={`focus-timer ${thread.timerOverdue ? 'focus-timer-overdue' : ''} ${thread.status !== 'active' ? 'focus-timer-paused' : ''}`}>
      <Timer size={10} strokeWidth={2} />
      {display}
    </span>
  );
}

function ReminderPill({ thread }) {
  const markReminderDue = useTaskStore(s => s.markReminderDue);
  const [display, setDisplay] = useState('');
  const firedRef = useRef(false);

  useEffect(() => {
    if (!thread.reminderDuration || !thread.reminderStartedAt || thread.reminderDue) {
      setDisplay(thread.reminderDue ? 'Due' : '');
      return;
    }
    const tick = () => {
      const remaining = getReminderRemaining(thread);
      setDisplay(formatTimer(remaining));
      if (remaining === 0 && !firedRef.current) {
        firedRef.current = true;
        markReminderDue(thread.id);
        toast.info(`Nudge ready: "${thread.title}"`);
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [thread, markReminderDue]);

  if (!display) return null;

  return (
    <span className={`focus-timer ${thread.reminderDue ? 'focus-timer-overdue' : ''}`}>
      <Bell size={10} strokeWidth={2} />
      {display}
    </span>
  );
}

// ─── Snapshot timeline (inside expanded card) ─────────────────────────────────
function SnapTimeline({ threadId, onEdit, onDelete }) {
  const getSnapshots = useTaskStore(s => s.getSnapshots);
  const snaps = getSnapshots(threadId);

  if (!snaps.length) {
    return <p style={{ fontSize: 12, color: 'hsl(var(--text-meta))', marginTop: 4 }}>No snapshots yet.</p>;
  }

  return (
    <div style={{ marginTop: 8 }}>
      {snaps.map(snap => (
        <SnapRow key={snap.id} snap={snap} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

function SnapRow({ snap, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [la, setLa] = useState(snap.lastAction || '');
  const [ns, setNs] = useState(snap.nextStep || '');
  const [bl, setBl] = useState(snap.blocker || '');

  if (snap.type === 'resume_note' || snap.type === 'context_note') {
    return (
      <div className="snap-timeline-entry" style={{ marginBottom: 10, paddingBottom: 4 }}>
        <div
          className="snap-timeline-dot"
          style={{ background: snap.type === 'resume_note' ? 'hsl(var(--status-active))' : 'hsl(var(--primary))' }}
        />
        <div style={{ fontSize: 12, color: 'hsl(var(--text-meta))', lineHeight: 1.5 }}>
          <span
            style={{
              fontWeight: 600,
              color: snap.type === 'resume_note' ? 'hsl(var(--status-active))' : 'hsl(var(--primary))',
            }}
          >
            {snap.type === 'resume_note' ? 'Resumed' : snap.phase || 'Note'}
          </span>
          {snap.note && <span> - {snap.note}</span>}
          <span style={{ marginLeft: 6, fontSize: 11 }}>{getRelativeTime(snap.capturedAt)}</span>
        </div>
      </div>
    );
  }

  const saveEdit = () => {
    onEdit(snap.id, { lastAction: la, nextStep: ns, blocker: bl || null });
    setEditing(false);
  };

  return (
    <div className="snap-timeline-entry" style={{ marginBottom: 12, paddingBottom: 4 }}>
      <div className="snap-timeline-dot" />
      <div style={{ background: 'hsl(var(--surface-raised))', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>{getRelativeTime(snap.capturedAt)}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!editing && (
              <button onClick={() => setEditing(true)} style={{ fontSize: 10, color: 'hsl(var(--text-meta))', background: 'none', border: 'none', cursor: 'pointer' }}>
                Edit
              </button>
            )}
            <button onClick={() => onDelete(snap.id)} style={{ fontSize: 10, color: 'hsl(var(--destructive))', background: 'none', border: 'none', cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea value={la} onChange={e => setLa(e.target.value)} rows={2}
              className="snap-textarea" style={{ fontSize: 12 }} />
            <textarea value={ns} onChange={e => setNs(e.target.value)} rows={2}
              className="snap-textarea" style={{ fontSize: 12 }} />
            <input value={bl} onChange={e => setBl(e.target.value)} placeholder="Blocker (optional)"
              className="snap-textarea" style={{ fontSize: 12, height: 30, padding: '4px 8px' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={saveEdit} className="btn-primary" style={{ height: 26, fontSize: 11 }}>Save</button>
              <button onClick={() => { setEditing(false); setLa(snap.lastAction); setNs(snap.nextStep); setBl(snap.blocker || ''); }}
                className="btn-ghost" style={{ height: 26, fontSize: 11 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'hsl(var(--text-title))', lineHeight: 1.5, marginBottom: 3 }}>
              <span style={{ fontWeight: 600 }}>Did:</span> {snap.lastAction}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 12, color: 'hsl(var(--text-title))', lineHeight: 1.5 }}>
              <ArrowRight size={11} strokeWidth={2.5} style={{ color: 'hsl(var(--primary))', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>{snap.nextStep}</span>
            </div>
            {snap.blocker && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 12, color: 'hsl(var(--status-stuck))', marginTop: 4 }}>
                <Ban size={11} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                {snap.blocker}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main ThreadCard ──────────────────────────────────────────────────────────
export function ThreadCard({ thread, rank, isPriority, onSnapshot, onOpenTrackDrawer, onOpenDetailDrawer, isFocused, highlightId }) {
  const {
    updateThreadStatus, closeThread, deleteThread, updateThreadEmoji, updateThreadTrack,
    updateThreadPriority, addCounter, updateCounter, deleteCounter,
    getLatestSnapshot, editSnapshot, deleteSnapshot, customTracks, acknowledgeReminder,
  } = useTaskStore();

  const [showResume, setShowResume]       = useState(false);
  const [showExpanded, setShowExpanded]   = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTimer, setShowTimer]         = useState(false);
  const [showPrevCtx, setShowPrevCtx]     = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);
  const [priorityDraft, setPriorityDraft] = useState(String(thread.priorityValue ?? DEFAULT_PRIORITY));
  const [counterDraft, setCounterDraft] = useState('');

  const snap = getLatestSnapshot(thread.id);
  const handoffPreview = getSnapshotHandoff(snap, thread.status);

  // dnd-kit sortable
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: thread.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Close expanded when status changes
  useEffect(() => {
    if (thread.status !== 'active') setShowExpanded(false);
  }, [thread.status]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail === thread.id) {
        if (thread.status === 'active' || thread.status === 'delayed') onOpenDetailDrawer(thread);
        else setShowResume(true);
      }
    };
    window.addEventListener('threadmark:expand', handler);
    return () => window.removeEventListener('threadmark:expand', handler);
  }, [thread.id, thread.status, thread, onOpenDetailDrawer]);

  // Card class
  let cardClass = 'thread-card group';
  if (thread.timerOverdue)              cardClass += ' thread-card-overdue';
  else if (thread.status === 'delayed') cardClass += ' thread-card-delayed';
  else if (thread.status === 'stuck')   cardClass += ' thread-card-stuck';
  else if (thread.status === 'paused')  cardClass += ' thread-card-paused';
  else if (isPriority)                  cardClass += ' thread-card-priority';

  const handleCardClick = (e) => {
    // Don't expand if clicking a button or interactive element
    if (e.target.closest('button') || e.target.closest('[role="button"]') || e.target.closest('a')) return;
    if (thread.status === 'active' || thread.status === 'delayed') {
      onOpenDetailDrawer(thread);
    } else if (thread.status === 'paused' || thread.status === 'stuck') {
      onOpenDetailDrawer(thread);
    }
  };

  const handleStartWorking = () => {
    updateThreadStatus(thread.id, 'active');
    setShowResume(false);
  };

  const trackColor = getTrackColor(thread.track);
  const isHighlighted = highlightId === thread.id;
  const savePriority = () => {
    if (!/^\d+$/.test(priorityDraft.trim())) {
      toast.error('Priority must be a whole number.');
      return;
    }
    updateThreadPriority(thread.id, Number(priorityDraft));
    setEditingPriority(false);
  };
  const handleAddCounter = () => {
    const result = addCounter(thread.id, counterDraft);
    if (result?.ok === false) toast.error(result.error);
    else setCounterDraft('');
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      data-thread-id={thread.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      className={isHighlighted || isFocused ? 'ring-2 ring-offset-2 rounded-[var(--radius)]' : ''}
    >
      <div
        className={cardClass}
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
        {/* ── Top: drag + emoji + title + badges ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>

          {/* Drag handle */}
          <span
            className="drag-handle"
            style={{ marginTop: 2 }}
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={13} />
          </span>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Row 1: emoji + title + status + priority badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
              {/* Emoji (shows on hover or if set) */}
              <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                {thread.emoji ? (
                  <button
                    onClick={() => setShowEmojiPicker(v => !v)}
                    style={{ fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}
                    title="Change emoji"
                  >
                    {thread.emoji}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowEmojiPicker(v => !v)}
                    style={{
                      opacity: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                      borderRadius: 4, color: 'hsl(var(--text-meta))',
                    }}
                    className="group-hover:opacity-100"
                    title="Add emoji"
                  >
                    <Smile size={13} />
                  </button>
                )}
                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onSelect={(em) => { updateThreadEmoji(thread.id, em); setShowEmojiPicker(false); }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: 16, fontWeight: 600,
                  color: 'hsl(var(--text-title))',
                  lineHeight: 1.25,
                  opacity: thread.status === 'paused' ? 0.75 : 1,
                }}
              >
                {thread.title}
              </h3>

              <StatusBadge status={thread.status} />

              <span className="priority-badge"><Flag size={10} /> {thread.priorityValue ?? DEFAULT_PRIORITY}</span>
              {thread.reminderDue && <span className="priority-badge" style={{ color: 'hsl(var(--timer-overdue-border))' }}>Nudge</span>}
            </div>

            {/* Row 2: track + time + timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Track badge - click to open drawer */}
              <button
                className="track-badge"
                onClick={e => { e.stopPropagation(); onOpenTrackDrawer(thread.track); }}
                title={`View all ${thread.track} threads`}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: trackColor, flexShrink: 0 }} />
                {thread.track}
              </button>

              {/* Snapshot time */}
              {snap && (
                <span style={{ fontSize: 12, color: 'hsl(var(--text-meta))', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={10} strokeWidth={1.8} />
                  {getRelativeTime(snap.capturedAt)}
                </span>
              )}
              {!snap && thread.status === 'active' && (
                <span style={{ fontSize: 12, color: 'hsl(var(--text-meta))' }}>No snapshot yet</span>
              )}

              {/* Focus / countdown timer or dates */}
              {thread.timerDuration && <FocusTimer thread={thread} />}
              <ReminderPill thread={thread} />
              <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>
                Created {getRelativeTime(thread.createdAt)} · Updated {getRelativeTime(thread.updatedAt || thread.createdAt)}
              </span>
            </div>

            {(thread.counters || []).length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }} onClick={e => e.stopPropagation()}>
                {thread.counters.map(counter => (
                  <span key={counter.id} className="counter-pill">
                    <Hash size={10} /> {counter.name}: {counter.value}
                    <button title={`Increment ${counter.name}`} onClick={() => updateCounter(thread.id, counter.id, 1)}>+</button>
                  </span>
                ))}
              </div>
            )}

            {/* Row 3: next step preview */}
            {(snap?.lastAction || handoffPreview) && !showExpanded && thread.status !== 'stuck' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 7 }}>
                <span style={{ fontSize: 12, color: 'hsl(var(--text-meta))', flexShrink: 0, marginTop: 1 }}>
                  {thread.status === 'paused' && handoffPreview ? 'Next:' : 'Context:'}
                </span>
                <p style={{
                  fontSize: 13, color: 'hsl(var(--text-body))', lineHeight: 1.5,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {thread.status === 'paused' && handoffPreview ? handoffPreview.value : snap.lastAction}
                </p>
              </div>
            )}

            {/* Stuck preview */}
            {thread.status === 'stuck' && (handoffPreview || snap?.lastAction) && !showExpanded && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 6 }}>
                <Ban size={11} strokeWidth={2} style={{ color: 'hsl(var(--status-stuck))', marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'hsl(var(--text-meta))', flexShrink: 0 }}>Reason:</span>
                <p style={{
                  fontSize: 12, color: 'hsl(var(--status-stuck))', lineHeight: 1.4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {handoffPreview?.value || snap.lastAction}
                </p>
              </div>
            )}
          </div>

          {/* ── Right: CTAs ── */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {thread.status === 'active' || thread.status === 'delayed' ? (
              <>
                {/* Timer button */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowTimer(v => !v)}
                    title="Set focus timer"
                    style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: thread.timerDuration
                        ? '1px solid hsl(var(--primary) / 0.4)'
                        : '1px solid hsl(var(--border))',
                      background: thread.timerDuration
                        ? 'hsl(var(--primary-subtle))'
                        : 'transparent',
                      color: thread.timerDuration
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--text-meta))',
                      opacity: 0,
                      transition: 'opacity 150ms, background 150ms',
                      cursor: 'pointer',
                    }}
                    className="group-hover:opacity-100"
                  >
                    <Timer size={12} strokeWidth={2} />
                  </button>
                  {showTimer && (
                    <TimerPopover thread={thread} onClose={() => setShowTimer(false)} />
                  )}
                </div>

                {/* Snapshot / Context */}
                <button
                  onClick={() => onSnapshot(thread)}
                  className="btn-primary"
                >
                  <Camera size={11} strokeWidth={2} /> Snapshot
                </button>
                <button onClick={() => closeThread(thread.id)} className="btn-ghost" title="Done with thread">
                  <CheckCircle2 size={12} /> Done
                </button>
              </>
            ) : thread.status === 'paused' || thread.status === 'stuck' ? (
              <button
                onClick={() => setShowResume(v => !v)}
                className={`btn-outline-indigo ${showResume ? 'active' : ''}`}
              >
                {showResume ? <X size={10} strokeWidth={2} /> : <Play size={10} strokeWidth={2} />}
                {showResume ? 'Close' : 'Resume'}
              </button>
            ) : null}

            {thread.reminderDue && (
              <button onClick={() => acknowledgeReminder(thread.id)} className="btn-primary">
                <CheckCircle2 size={11} /> Acknowledge
              </button>
            )}

            {/* Overflow menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  style={{
                    width: 28, height: 28, borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', background: 'transparent',
                    color: 'hsl(var(--text-meta))',
                    opacity: 0, transition: 'opacity 150ms',
                    cursor: 'pointer',
                  }}
                  className="group-hover:opacity-100 hover:bg-muted"
                >
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {thread.status !== 'active' && (
                  <DropdownMenuItem onClick={() => updateThreadStatus(thread.id, 'active')} className="text-xs">
                    Mark as Active
                  </DropdownMenuItem>
                )}
                {thread.status === 'stuck' && (
                  <DropdownMenuItem onClick={() => updateThreadStatus(thread.id, 'paused')} className="text-xs">
                    Move to Paused
                  </DropdownMenuItem>
                )}
                {thread.status === 'active' && (
                  <DropdownMenuItem onClick={() => updateThreadStatus(thread.id, 'stuck')} className="text-xs">
                    Move to Stuck
                  </DropdownMenuItem>
                )}
                {thread.status === 'active' && (
                  <DropdownMenuItem onClick={() => updateThreadStatus(thread.id, 'paused')} className="text-xs">
                    Move to Paused
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flag size={12} style={{ color: 'hsl(var(--primary))' }} />
                  {editingPriority ? (
                    <>
                      <input className="no-spinner" inputMode="numeric" value={priorityDraft} onChange={e => setPriorityDraft(e.target.value)} style={{ width: 64, fontSize: 11, background: 'hsl(var(--surface-raised))', color: 'hsl(var(--text-title))', border: '1px solid hsl(var(--border))', borderRadius: 5, padding: '2px 5px' }} />
                      <button onClick={savePriority} className="btn-ghost" style={{ height: 22, fontSize: 10 }}>Save</button>
                    </>
                  ) : (
                    <button onClick={() => setEditingPriority(true)} className="btn-ghost" style={{ height: 22, fontSize: 10 }}>
                      Priority {thread.priorityValue ?? DEFAULT_PRIORITY}
                    </button>
                  )}
                </div>
                <div style={{ padding: '0 8px 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <input value={counterDraft} onChange={e => setCounterDraft(e.target.value)} placeholder="Counter name" style={{ flex: 1, minWidth: 0, fontSize: 11, background: 'hsl(var(--surface-raised))', color: 'hsl(var(--text-title))', border: '1px solid hsl(var(--border))', borderRadius: 5, padding: '3px 6px' }} />
                  <button onClick={handleAddCounter} className="btn-ghost" style={{ height: 22, fontSize: 10 }}>Add</button>
                </div>
                <DropdownMenuSeparator />
                <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-meta))', textTransform: 'uppercase' }}>Change Track</div>
                {customTracks && customTracks.map(t => (
                  <DropdownMenuItem key={t} onClick={() => updateThreadTrack(thread.id, t)} className="text-xs">
                    {t}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => closeThread(thread.id)} className="text-xs">
                  Done with thread
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-destructive focus:text-destructive">
                  Delete permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="inline-confirm" onClick={e => e.stopPropagation()}>
            <span><Trash2 size={12} /> Delete forever?</span>
            <button onClick={() => deleteThread(thread.id)} className="btn-primary" style={{ height: 24, fontSize: 11, background: 'hsl(var(--destructive))' }}>Sure</button>
            <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost" style={{ height: 24, fontSize: 11 }}>Cancel</button>
          </div>
        )}

        {/* ── Expanded content (active cards) ── */}
        <AnimatePresence>
          {showExpanded && thread.status === 'active' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}>
                {/* Full Context */}
                {snap?.lastAction && (
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>Context</span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--text-title))', lineHeight: 1.55 }}>{snap.lastAction}</p>
                    </div>
                  </div>
                )}

                {/* Snapshot history toggle */}
                <button
                  onClick={() => setShowPrevCtx(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-meta))',
                    background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}
                >
                  {showPrevCtx ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {showPrevCtx ? 'Hide' : 'Show'} snapshot history
                </button>

                {showPrevCtx && (
                  <SnapTimeline
                    threadId={thread.id}
                    onEdit={editSnapshot}
                    onDelete={deleteSnapshot}
                  />
                )}

                {/* Quick actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => onSnapshot(thread)} className="btn-primary" style={{ height: 30, fontSize: 12 }}>
                    <Camera size={11} /> Snapshot
                  </button>
                  <button onClick={() => closeThread(thread.id)} className="btn-ghost" style={{ height: 30, fontSize: 12 }}>
                    Done with thread
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand indicator for active cards */}
        {thread.status === 'active' && (
          <div
            style={{
              position: 'absolute', bottom: 6, right: '50%', transform: 'translateX(50%)',
              opacity: 0, transition: 'opacity 150ms',
            }}
            className="group-hover:opacity-100"
          >
            {showExpanded
              ? <ChevronUp size={12} style={{ color: 'hsl(var(--text-muted))' }} />
              : <ChevronDown size={12} style={{ color: 'hsl(var(--text-muted))' }} />}
          </div>
        )}
      </div>

      {/* Resume accordion (inline below card for paused/stuck) */}
      <AnimatePresence>
        {showResume && (thread.status === 'paused' || thread.status === 'stuck') && (
          <ResumeCard thread={thread} onStartWorking={handleStartWorking} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

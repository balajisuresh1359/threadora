import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellRing, Camera, CheckCircle2, Flag, Play, Smile, Pin } from 'lucide-react';
import { toast } from 'sonner';
import {
  DEFAULT_PRIORITY,
  PRIORITY_OPTIONS,
  formatDuration,
  getPriorityLabel,
  getReminderRemaining,
  useTaskStore,
} from '../store/useTaskStore';
import { getTrackColor } from '../utils/trackColors';
import { EmojiPicker } from './EmojiPicker';
import { ReminderPopover } from './ReminderPopover';

function NotificationPill({ thread }) {
  const markReminderDue = useTaskStore(state => state.markReminderDue);
  const [display, setDisplay] = useState('');
  const firedRef = useRef(false);

  useEffect(() => {
    if ((!thread.reminderAbsoluteAt && (!thread.reminderDuration || !thread.reminderStartedAt)) || thread.reminderDue) {
      setDisplay(thread.reminderDue ? 'Ready' : '');
      return;
    }

    const tick = () => {
      const remaining = getReminderRemaining(thread);
      setDisplay(formatDuration(remaining));
      if (remaining === 0 && !firedRef.current) {
        firedRef.current = true;
        markReminderDue(thread.id);
        toast.info(`Reminder ready: "${thread.title}"`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [thread, markReminderDue]);

  if (!display) return null;

  if (thread.reminderDue) {
    return <span className="reminder-pill reminder-pill-due" title="Reminder ready"><BellRing size={13} strokeWidth={2.2} /></span>;
  }

  return <span className="reminder-pill"><Bell size={10} strokeWidth={2} />{display}</span>;
}

function getSnapshotPreview(snapshot) {
  return snapshot?.note || snapshot?.lastAction || snapshot?.nextStep || snapshot?.blocker || '';
}

function getCompactAge(dateValue) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000));
  if (elapsedSeconds < 60) return `${elapsedSeconds}s`;
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function ThreadCard({ thread, onSnapshot, isFocused, onOpenTrackDrawer, onOpenDetailDrawer, onNavigateToThread, activeTab }) {
  const snapshots = useTaskStore(state => state.snapshots);
  const updateThreadStatus = useTaskStore(state => state.updateThreadStatus);
  const closeThread = useTaskStore(state => state.closeThread);
  const updateThreadEmoji = useTaskStore(state => state.updateThreadEmoji);
  const updateThreadPriority = useTaskStore(state => state.updateThreadPriority);
  const togglePinThread = useTaskStore(state => state.togglePinThread);
  const allThreads = useTaskStore(state => state.threads);
  const activeBlockers = allThreads.filter(t => (thread.dependsOn || []).includes(t.id) && t.status !== 'closed');
  const [showNotification, setShowNotification] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showBlockerPopover, setShowBlockerPopover] = useState(false);
  const blockerPopoverRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (blockerPopoverRef.current && !blockerPopoverRef.current.contains(e.target)) {
        setShowBlockerPopover(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const latestSnapshot = snapshots
    .filter(snapshot => snapshot.threadId === thread.id)
    .sort((first, second) => new Date(second.capturedAt) - new Date(first.capturedAt))[0];
  const snapshotPreview = getSnapshotPreview(latestSnapshot);
  const trackColor = getTrackColor(thread.tracks?.[0] || thread.track);
  const parked = thread.status === 'paused' || thread.status === 'stuck' || thread.status === 'delayed';
  const parkedLabel = thread.status === 'stuck' ? 'Stuck' : 'Later';
  const cardStatusClass = thread.status === 'stuck'
    ? 'thread-card-stuck'
    : parked
      ? 'thread-card-paused'
      : '';

  const style = {
    position: 'relative',
    borderLeft: `4px solid ${trackColor}`,
    zIndex: showNotification || showEmoji ? 80 : undefined,
  };

  const openDetails = () => onOpenDetailDrawer?.(thread);
  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter') {
      openDetails();
    }
  };

  return (
    <motion.div
      data-thread-id={thread.id}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      className={isFocused ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background rounded-[var(--radius)]' : ''}
    >
      <div className={`thread-card ${cardStatusClass}`} role="button" tabIndex={0} onClick={openDetails} onKeyDown={handleCardKeyDown}>
        <div className="thread-card-main">
          <div className="thread-card-content">
            {/* ROW A: pin + emoji + title only */}
            <div className="thread-card-level-one" style={{ flexWrap: 'nowrap' }}>
              {activeTab !== 'nudges' && (
                <button
                  type="button"
                  className={`card-pin-button ${thread.isPinned ? 'pinned' : ''}`}
                  onClick={(e) => { e.stopPropagation(); togglePinThread(thread.id); }}
                  title={thread.isPinned ? "Unpin thread" : "Pin thread"}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: thread.isPinned ? 'hsl(var(--status-active))' : 'hsl(var(--text-muted))',
                    opacity: thread.isPinned ? 1 : 0.35,
                    cursor: 'pointer', marginRight: 4, flexShrink: 0,
                    transition: 'opacity 0.15s, color 0.15s',
                  }}
                >
                  <Pin size={13} style={{ transform: thread.isPinned ? 'rotate(45deg)' : 'none' }} />
                </button>
              )}
              <div className="thread-card-emoji-control" onClick={event => event.stopPropagation()}>
                <button type="button" className="thread-card-emoji-button" onClick={() => setShowEmoji(current => !current)} aria-label="Change emoji">
                  {thread.emoji || <Smile size={14} />}
                </button>
                <EmojiPicker isOpen={showEmoji} onSelect={emoji => updateThreadEmoji(thread.id, emoji)} onClose={() => setShowEmoji(false)} />
              </div>

              <h2 className="thread-card-title" title={thread.title}>{thread.title}</h2>
              {thread.pinnedSnapshotId && (
                <span title="Has a pinned snapshot" style={{ fontSize: 11, flexShrink: 0 }}>📌</span>
              )}
            </div>

            {/* ROW B: chips + action button */}
            <div className="thread-card-chips-row">
              {/* Track chips capped at 3 */}
              {(() => {
                const allTracks = thread.tracks || [thread.track || 'Other'];
                const visible = allTracks.slice(0, 3);
                const extra = allTracks.length - 3;
                return (
                  <>
                    {visible.map(tr => {
                      const trColor = getTrackColor(tr);
                      return (
                        <button
                          key={tr}
                          type="button"
                          className="meta-chip track-chip"
                          style={{ borderColor: trColor, color: trColor, flexShrink: 0 }}
                          onClick={event => { event.stopPropagation(); onOpenTrackDrawer?.(tr); }}
                        >
                          {tr}
                        </button>
                      );
                    })}
                    {extra > 0 && (
                      <span className="meta-chip" style={{ flexShrink: 0, color: 'hsl(var(--text-muted))', borderColor: 'hsl(var(--border))' }}>
                        +{extra}
                      </span>
                    )}
                  </>
                );
              })()}

              {parked && (
                <span className={`parked-reason-label ${thread.status === 'stuck' ? 'parked-reason-stuck' : ''}`}>
                  {parkedLabel}
                </span>
              )}

              {activeBlockers.length > 0 && (
                <div style={{ position: 'relative', display: 'inline-flex' }} ref={blockerPopoverRef}>
                  <button
                    type="button"
                    className="meta-chip"
                    style={{
                      background: 'hsl(var(--status-stuck-bg) / 0.4)',
                      color: 'hsl(var(--status-stuck))',
                      borderColor: 'hsl(var(--status-stuck) / 0.3)',
                      fontSize: 11, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
                      maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                    onClick={event => { event.stopPropagation(); setShowBlockerPopover(p => !p); }}
                    title="Click to see all blockers"
                  >
                    🚫 {activeBlockers[0].title.length > 14 ? activeBlockers[0].title.slice(0, 14) + '…' : activeBlockers[0].title}
                    {activeBlockers.length > 1 && ` +${activeBlockers.length - 1}`}
                  </button>
                  {showBlockerPopover && (
                    <div
                      style={{
                        position: 'absolute', bottom: '110%', left: 0, zIndex: 200,
                        background: 'hsl(var(--surface-raised))',
                        border: '1px solid hsl(var(--border-strong))',
                        borderRadius: 'var(--radius)',
                        padding: '8px 10px',
                        minWidth: 180, maxWidth: 260,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        display: 'flex', flexDirection: 'column', gap: 6,
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))', marginBottom: 2 }}>Blocked by</div>
                      {activeBlockers.map(blocker => (
                        <button
                          key={blocker.id}
                          type="button"
                          style={{
                            background: 'none', border: 'none', padding: '2px 0',
                            fontSize: 12, fontWeight: 500,
                            color: 'hsl(var(--text-title))',
                            cursor: 'pointer', textAlign: 'left',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                          onClick={() => {
                            setShowBlockerPopover(false);
                            if (onNavigateToThread) {
                              onNavigateToThread(blocker);
                            } else {
                              onOpenDetailDrawer?.(blocker);
                            }
                          }}
                        >
                          <span style={{ color: 'hsl(var(--status-stuck))' }}>🚫</span>
                          {blocker.emoji || ''} {blocker.title.length > 36 ? blocker.title.slice(0, 36) + '…' : blocker.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Primary action pushed to right */}
              <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                {parked ? (
                  <button type="button" className="card-primary-action card-primary-resume" onClick={event => { event.stopPropagation(); updateThreadStatus(thread.id, 'active'); }}>
                    <Play size={13} /> Resume
                  </button>
                ) : (
                  <button type="button" className="card-primary-action" onClick={event => { event.stopPropagation(); onSnapshot?.(thread); }}>
                    <Camera size={13} /> Snapshot
                  </button>
                )}
              </div>
            </div>


            <div className="thread-card-level-two">
              <div className="thread-card-note-preview">
                <span className="thread-card-note-label">Latest note</span>
                <p>{snapshotPreview || 'No snapshot yet'}</p>
              </div>

              <div className="thread-card-secondary-stack" onClick={event => event.stopPropagation()}>
                <div className="thread-card-secondary-actions">
                  <button type="button" className="card-icon-action" onClick={() => setShowNotification(current => !current)} aria-label="Set reminder" title="Reminder">
                    <Bell size={14} />
                  </button>
                  <label className="card-action card-priority-control">
                    <Flag size={12} />
                    <span>{getPriorityLabel(thread.priorityValue)}</span>
                    <select aria-label="Priority" value={thread.priorityValue ?? DEFAULT_PRIORITY} onChange={event => updateThreadPriority(thread.id, Number(event.target.value))}>
                      {PRIORITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                </div>
                <div className="desktop-reminder-pill">
                  <NotificationPill thread={thread} />
                </div>
              </div>
            </div>

            <div className="thread-card-level-three">
              <span className="thread-created-age">{getCompactAge(thread.createdAt)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="mobile-reminder-pill">
                  <NotificationPill thread={thread} />
                </div>
                {!parked && (
                  <button type="button" className="card-done-icon" onClick={event => { event.stopPropagation(); closeThread(thread.id); }} aria-label="Done" title="Done">
                    <CheckCircle2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showNotification && <ReminderPopover thread={thread} onClose={() => setShowNotification(false)} />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

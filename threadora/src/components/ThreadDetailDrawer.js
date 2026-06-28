import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Ban, Play, Edit2, Copy, Check, Trash2, CheckCircle2, Pause, Clock, Paperclip, Search, Pin, PinOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../store/useTaskStore';
import { getTrackColor } from '../utils/trackColors';
import { getRelativeTime } from '../utils/timeUtils';
import { buildSnapshotCopyText, getSnapshotHandoff } from '../utils/snapshotUtils';
import { TrackCombobox } from './TrackCombobox';

function DeleteNoteConfirm({ onConfirm, onCancel }) {
  return (
    <div className="note-delete-confirm">
      <span>Delete this note?</span>
      <div>
        <button type="button" className="note-delete-confirm-cancel" onClick={onCancel}>Keep</button>
        <button type="button" className="note-delete-confirm-delete" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  );
}

function SnapEntry({ snap, threadStatus, threadId, pinnedSnapshotId, onEdit, onDelete, onPin, onRestore }) {
  const [editing, setEditing] = useState(false);
  const [la, setLa] = useState(snap.lastAction || snap.note || '');
  const [ns, setNs] = useState(snap.nextStep || '');
  const [bl, setBl] = useState(snap.blocker || '');
  const [copied, setCopied] = useState(false);
  const [expandedText, setExpandedText] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const { getLatestSnapshot } = useTaskStore();
  const handoff = getSnapshotHandoff(snap, threadStatus);
  const isPinned = pinnedSnapshotId === snap.id;
  const latest = getLatestSnapshot(snap.threadId);
  const isLatest = latest && latest.id === snap.id;

  const handleCopy = () => {
    const textToCopy = buildSnapshotCopyText(snap, threadStatus);
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (snap.type === 'resume_note') {
    return (
      <div className="snap-timeline-entry" style={{ marginBottom: 16, paddingBottom: 4 }}>
        <div className="snap-timeline-dot" style={{ background: 'hsl(var(--status-active))' }} />
        <div style={{ background: 'hsl(var(--status-active-bg))', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--status-active))', marginBottom: 2 }}>Resumed</p>
            <button onClick={() => setConfirmingDelete(true)} style={{ fontSize: 10, color: 'hsl(var(--destructive))', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Trash2 size={9} /> delete
            </button>
          </div>
          {snap.note && (
            <p style={{ fontSize: 12, color: 'hsl(var(--text-body))', whiteSpace: 'pre-wrap', cursor: snap.note.length > 200 ? 'pointer' : 'default' }} onClick={() => snap.note.length > 200 && setExpandedText(snap.note)}>
              {snap.note.length > 200 ? snap.note.slice(0, 200) + '... (click to expand)' : snap.note}
            </p>
          )}
          <p style={{ fontSize: 11, color: 'hsl(var(--text-meta))', marginTop: 4 }}>{getRelativeTime(snap.capturedAt)}</p>
          {confirmingDelete && (
            <DeleteNoteConfirm
              onCancel={() => setConfirmingDelete(false)}
              onConfirm={() => onDelete(snap.id)}
            />
          )}
        </div>
      </div>
    );
  }

  const saveEdit = () => {
    if (snap.type === 'context_note' || snap.type === 'resume_note') {
      onEdit(snap.id, { note: la });
    } else {
      onEdit(snap.id, { lastAction: la, nextStep: ns, blocker: bl || null });
    }
    setEditing(false);
  };

  return (
    <div className="snap-timeline-entry" style={{ marginBottom: 16 }}>
      <div className="snap-timeline-dot" />
      <div
        style={{
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))' }}>{getRelativeTime(snap.capturedAt)}</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={handleCopy}
              style={{ fontSize: 10, color: copied ? 'hsl(var(--status-active))' : 'hsl(var(--text-meta))', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, marginRight: 4 }}
            >
              {copied ? <Check size={9} /> : <Copy size={9} />} copy
            </button>
            {/* T11: Pin button */}
            <button
              onClick={() => onPin(snap.id)}
              title={isPinned ? 'Unpin' : 'Pin to top'}
              style={{ fontSize: 10, color: isPinned ? 'hsl(var(--primary))' : 'hsl(var(--text-meta))', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              {isPinned ? <PinOff size={9} /> : <Pin size={9} />} {isPinned ? 'unpin' : 'pin'}
            </button>
            {/* T10: Restore button */}
            {!isLatest && snap.type === 'snapshot' && (
              <button
                onClick={() => setShowDiff(true)}
                title="Restore this snapshot to current active state"
                style={{ fontSize: 10, color: 'hsl(var(--text-meta))', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <RotateCcw size={9} /> restore
              </button>
            )}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{ fontSize: 10, color: 'hsl(var(--text-meta))', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <Edit2 size={9} /> edit
              </button>
            )}
            <button
              onClick={() => setConfirmingDelete(true)}
              style={{ fontSize: 10, color: 'hsl(var(--destructive))', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Trash2 size={9} /> delete
            </button>
          </div>
        </div>

        {confirmingDelete && (
          <DeleteNoteConfirm
            onCancel={() => setConfirmingDelete(false)}
            onConfirm={() => onDelete(snap.id)}
          />
        )}

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea value={la} onChange={e => setLa(e.target.value)} rows={2} className="snap-textarea" style={{ fontSize: 12 }} />
            {snap.type === 'snapshot' && (
              <>
                <textarea value={ns} onChange={e => setNs(e.target.value)} rows={2} className="snap-textarea" style={{ fontSize: 12 }} />
                <input value={bl} onChange={e => setBl(e.target.value)} placeholder="Blocker (optional)" className="snap-textarea" style={{ fontSize: 12, height: 32, padding: '4px 8px' }} />
              </>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={saveEdit} className="btn-primary" style={{ height: 26, fontSize: 11 }}>Save</button>
              <button onClick={() => { setEditing(false); setLa(snap.lastAction || snap.note || ''); setNs(snap.nextStep || ''); setBl(snap.blocker || ''); }} className="btn-ghost" style={{ height: 26, fontSize: 11 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {(snap.type === 'snapshot' || snap.type === 'context_note') && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Note or Last Action */}
                {(snap.note || snap.lastAction) && (
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>
                      {snap.type === 'context_note' ? snap.phase || 'Note' : 'Context'}
                    </span>
                    <p
                      style={{ fontSize: 13, color: 'hsl(var(--text-title))', lineHeight: 1.5, marginTop: 4, whiteSpace: 'pre-wrap', cursor: (snap.note || snap.lastAction).length > 300 ? 'pointer' : 'default' }}
                      onClick={() => (snap.note || snap.lastAction).length > 300 && setExpandedText(snap.note || snap.lastAction)}
                    >
                      {(snap.note || snap.lastAction).length > 300 ? (snap.note || snap.lastAction).slice(0, 300) + '... (click to expand)' : (snap.note || snap.lastAction)}
                    </p>
                  </div>
                )}
                
                {/* Next step / Reason */}
                {handoff && (
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>
                      {threadStatus === 'stuck' ? 'Reason' : handoff.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
                      {threadStatus === 'stuck' ? (
                        <Ban size={12} strokeWidth={2} style={{ color: 'hsl(var(--status-stuck))', marginTop: 2, flexShrink: 0 }} />
                      ) : (
                        <ArrowRight size={12} strokeWidth={2.5} style={{ color: 'hsl(var(--primary))', marginTop: 2, flexShrink: 0 }} />
                      )}
                      <p style={{ fontSize: 13, color: 'hsl(var(--text-title))', lineHeight: 1.5 }}>
                        {handoff.value}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Blocker */}
                {snap.blocker && (!handoff || handoff.value !== snap.blocker) && (
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>Blocker</span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
                      <Ban size={12} strokeWidth={2} style={{ color: 'hsl(var(--status-stuck))', marginTop: 2, flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: 'hsl(var(--status-stuck))', lineHeight: 1.5 }}>{snap.blocker}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {snap.fileAttachment && (
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>Attachment</span>
                <div style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.electronAPI) {
                        window.electronAPI.openFile(snap.fileAttachment.path);
                      } else {
                        toast.error("File attachments can only be opened in the desktop app.");
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))',
                      padding: '4px 10px', borderRadius: 6, fontSize: 12, color: 'hsl(var(--text-title))',
                      cursor: 'pointer'
                    }}
                  >
                    <Paperclip size={12} style={{ color: 'hsl(var(--text-muted))' }} />
                    {snap.fileAttachment.name}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    <AnimatePresence>
      {showDiff && (() => {
        const latest = getLatestSnapshot(snap.threadId);
        const currentText = latest ? (latest.lastAction || latest.note || '') : '(no current snapshot)';
        const targetText = snap.lastAction || snap.note || '';
        const currLines = currentText.split('\n');
        const tgtLines = targetText.split('\n');
        return (
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} onClick={() => setShowDiff(false)} />
            <motion.div
              style={{ background: 'hsl(var(--surface))', padding: 24, borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto', position: 'relative', zIndex: 201 }}
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            >
              <button onClick={() => setShowDiff(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-meta))' }}>
                <X size={16} />
              </button>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'hsl(var(--text-title))' }}>Restore snapshot?</h3>
              <p style={{ fontSize: 12, color: 'hsl(var(--text-meta))', marginBottom: 16 }}>Line-level diff: current → this snapshot</p>
              <div style={{ fontFamily: 'monospace', fontSize: 12, background: 'hsl(var(--surface-raised))', borderRadius: 8, padding: '12px 14px', marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
                {currLines.map((line, i) => {
                  const inTarget = tgtLines.includes(line);
                  if (inTarget) return <div key={`c${i}`} style={{ color: 'hsl(var(--text-muted))', padding: '1px 0' }}>&nbsp; {line}</div>;
                  return <div key={`r${i}`} style={{ background: 'hsl(0 70% 50% / 0.1)', color: 'hsl(0 70% 50%)', padding: '1px 0' }}>- {line}</div>;
                })}
                {tgtLines.map((line, i) => {
                  const inCurrent = currLines.includes(line);
                  if (inCurrent) return null;
                  return <div key={`a${i}`} style={{ background: 'hsl(142 70% 45% / 0.1)', color: 'hsl(142 70% 35%)', padding: '1px 0' }}>+ {line}</div>;
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-primary"
                  style={{ height: 34, fontSize: 13 }}
                  onClick={() => {
                    onRestore(snap);
                    toast.success('Snapshot restored');
                    setShowDiff(false);
                  }}
                >
                  <RotateCcw size={12} /> Confirm Restore
                </button>
                <button className="btn-ghost" style={{ height: 34, fontSize: 13 }} onClick={() => setShowDiff(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>

      <AnimatePresence>
        {expandedText && (
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setExpandedText(null)} />
            <motion.div
              style={{ background: 'hsl(var(--surface))', padding: 24, borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto', position: 'relative', zIndex: 101 }}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            >
              <button onClick={() => setExpandedText(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-meta))' }}>
                <X size={16} />
              </button>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'hsl(var(--text-title))' }}>Full Note</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'hsl(var(--text-body))', whiteSpace: 'pre-wrap' }}>
                {expandedText}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ThreadDetailDrawer({ thread: initialThread, onClose }) {
  const { updateThreadStatus, closeThread, addContextNote, editSnapshot, deleteSnapshot, updateThreadTrack, customTracks, pinSnapshot, addSnapshot, addCustomTrack, toggleThreadDependency } = useTaskStore();
  const liveThread = useTaskStore(state => state.threads.find(item => item.id === initialThread.id));
  const thread = liveThread || initialThread;
  const [resumeNote, setResumeNote] = useState('');
  const [fileAttachment, setFileAttachment] = useState(null);
  const [editingTrack, setEditingTrack] = useState(false);
  const [trackDraft, setTrackDraft] = useState(thread.tracks || [thread.track]);
  const [noteQuery, setNoteQuery] = useState('');
  const [depQuery, setDepQuery] = useState('');
  const [showDepDropdown, setShowDepDropdown] = useState(false);
  const depWrapperRef = useRef(null);
  const allSnapshots = useTaskStore(s => s.snapshots);
  const allThreads = useTaskStore(s => s.threads);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (depWrapperRef.current && !depWrapperRef.current.contains(e.target)) {
        setShowDepDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setTrackDraft(thread.tracks || [thread.track]);
  }, [thread.id, thread.tracks, thread.track]);

  // T11: Pinned snap floats to top; otherwise oldest-first chronological order
  const snapshots = allSnapshots
    .filter(snap => snap.threadId === thread.id)
    .sort((a, b) => {
      if (thread.pinnedSnapshotId) {
        if (a.id === thread.pinnedSnapshotId) return -1;
        if (b.id === thread.pinnedSnapshotId) return 1;
      }
      return new Date(a.capturedAt) - new Date(b.capturedAt);
    });

  const filteredSnapshots = snapshots.filter(snap => {
    const q = noteQuery.trim().toLowerCase();
    if (!q) return true;
    const content = [snap.note, snap.lastAction, snap.nextStep, snap.blocker, snap.phase].join(' ').toLowerCase();
    return content.includes(q);
  });
  const color = getTrackColor(thread.tracks?.[0] || thread.track);
  const activeBlockers = allThreads.filter(t => (thread.dependsOn || []).includes(t.id) && t.status !== 'closed');
  const candidateBlockers = allThreads.filter(t =>
    t.id !== thread.id &&
    t.status !== 'closed' &&
    !(thread.dependsOn || []).includes(t.id) &&
    t.title.toLowerCase().includes(depQuery.trim().toLowerCase())
  );

  const handleAddNote = () => {
    if (resumeNote.trim() || fileAttachment) {
      const phase = thread.status === 'paused'
        ? 'Added while saved for later'
        : thread.status === 'stuck'
          ? 'Added while stuck'
          : thread.status === 'delayed'
            ? 'Added while delayed'
            : 'Active note';
      const result = addContextNote(thread.id, resumeNote, phase, fileAttachment);
      if (result?.ok === false) {
        toast.error(result.error);
      } else {
        setResumeNote('');
        setFileAttachment(null);
      }
    }
  };

  const handleResume = () => {
    handleAddNote();
    updateThreadStatus(thread.id, 'active');
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  const handleStuck = () => {
    updateThreadStatus(thread.id, 'stuck');
    onClose();
  };
  const handlePause = () => {
    updateThreadStatus(thread.id, 'paused');
    onClose();
  };

  const handleClose = () => {
    closeThread(thread.id);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="drawer-overlay" onClick={onClose} />

        <motion.div
          className="drawer-panel"
          style={{ width: '100%', maxWidth: 480 }}
          initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Header */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid hsl(var(--border))', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--text-title))', lineHeight: 1.3, marginBottom: 8 }}>
                  {thread.emoji && <span style={{ marginRight: 6 }}>{thread.emoji}</span>}
                  {thread.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  {editingTrack ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrackCombobox
                        tracks={customTracks}
                        value={trackDraft}
                        onChange={setTrackDraft}
                        onCreateTrack={addCustomTrack}
                        placeholder="Select tracks"
                        width={200}
                      />
                      <button onClick={() => { updateThreadTrack(thread.id, trackDraft); setEditingTrack(false); }} className="btn-ghost" style={{ height: 26, fontSize: 10, padding: '0 8px' }}>Save</button>
                    </div>
                  ) : (
                    <span onClick={() => setEditingTrack(true)} style={{ fontSize: 12, color: 'hsl(var(--text-meta))', cursor: 'pointer' }} className="hover:text-primary">
                      {thread.tracks?.join(', ') || thread.track}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: 'hsl(var(--text-meta))' }}>·</span>
                  <span className={`status-badge ${thread.status === 'active' ? 'status-badge-active' : 'status-badge-paused'}`}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}}/>
                    {thread.status === 'paused' || thread.status === 'stuck' ? 'Parked' : thread.status === 'active' ? 'Active' : thread.status.charAt(0).toUpperCase() + thread.status.slice(1)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, fontSize: 11, color: 'hsl(var(--text-meta))' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> Created {getRelativeTime(thread.createdAt)}</span>
                  <span>Updated {getRelativeTime(thread.updatedAt || thread.createdAt)}</span>
                </div>
              </div>
              <button onClick={onClose} style={{ padding: 6, border: 'none', background: 'transparent', borderRadius: 6 }} className="hover:bg-muted">
                <X size={15} style={{ color: 'hsl(var(--text-meta))' }} />
              </button>
            </div>
          </div>

          {/* T13: Blocked By dependency management */}
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6, borderBottom: '1px solid hsl(var(--border))' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>
              Blocked By
            </span>
            {activeBlockers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                {activeBlockers.map(blocker => (
                  <span
                    key={blocker.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('threadmark:navigate-thread', { detail: { id: blocker.id, openDetail: true } }));
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        window.dispatchEvent(new CustomEvent('threadmark:navigate-thread', { detail: { id: blocker.id, openDetail: true } }));
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'hsl(var(--status-stuck-bg) / 0.4)',
                      color: 'hsl(var(--status-stuck))',
                      fontSize: 12, padding: '3px 8px', borderRadius: 6,
                      border: '1px solid hsl(var(--status-stuck) / 0.15)',
                      cursor: 'pointer',
                    }}
                  >
                    {blocker.emoji && <span style={{ marginRight: 2 }}>{blocker.emoji}</span>}
                    <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {blocker.title}
                    </span>
                    <button
                      onClick={event => {
                        event.stopPropagation();
                        toggleThreadDependency(thread.id, blocker.id);
                      }}
                      style={{ background: 'none', border: 'none', color: 'hsl(var(--status-stuck))', cursor: 'pointer', padding: 0, fontSize: 10, fontWeight: 'bold' }}
                      aria-label={`Remove ${blocker.title} dependency`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ position: 'relative' }} ref={depWrapperRef}>
              <input
                type="text"
                placeholder="Search threads to block this one..."
                value={depQuery}
                onChange={e => { setDepQuery(e.target.value); setShowDepDropdown(true); }}
                onFocus={() => setShowDepDropdown(true)}
                style={{
                  width: '100%', height: 32, padding: '0 10px',
                  background: 'hsl(var(--surface-raised))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 7, fontSize: 12, color: 'hsl(var(--text-title))',
                  outline: 'none', fontFamily: 'var(--app-font), sans-serif',
                }}
              />
              {depQuery.trim() && showDepDropdown && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: 34,
                  background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))',
                  borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 50,
                  maxHeight: 180, overflowY: 'auto'
                }}>
                  {candidateBlockers.map(cand => (
                    <button
                      key={cand.id}
                      onClick={() => {
                        const res = toggleThreadDependency(thread.id, cand.id);
                        if (res?.ok === false) toast.error(res.error);
                        setDepQuery('');
                        setShowDepDropdown(false);
                      }}
                      style={{
                        width: '100%', padding: '8px 12px', border: 'none',
                        background: 'none', textAlign: 'left', fontSize: 12,
                        color: 'hsl(var(--text-title))', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                      className="hover:bg-muted"
                    >
                      <span>{cand.emoji || '💬'}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cand.title}</span>
                    </button>
                  ))}
                  {candidateBlockers.length === 0 && (
                    <div style={{ padding: '8px 12px', fontSize: 12, color: 'hsl(var(--text-muted))' }}>No other threads found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Snapshot timeline */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'hsl(var(--text-muted))', margin: 0 }}>Snapshot history</p>
              {snapshots.length > 0 && (
                <span style={{ fontSize: 10, color: 'hsl(var(--text-muted))' }}>
                  {filteredSnapshots.length}/{snapshots.length}
                </span>
              )}
            </div>

            {snapshots.length > 0 && (
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={12} style={{
                  position: 'absolute', left: 9, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--text-muted))', pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  value={noteQuery}
                  onChange={e => setNoteQuery(e.target.value)}
                  placeholder="Search notes..."
                  style={{
                    width: '100%', height: 32,
                    padding: '0 10px 0 28px',
                    background: 'hsl(var(--surface-raised))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 7,
                    fontSize: 12,
                    color: 'hsl(var(--text-title))',
                    outline: 'none',
                    fontFamily: 'var(--app-font), sans-serif',
                  }}
                />
                {noteQuery && (
                  <button
                    type="button"
                    onClick={() => setNoteQuery('')}
                    style={{
                      position: 'absolute', right: 7, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: 'hsl(var(--text-muted))', cursor: 'pointer',
                      padding: 0, display: 'flex', alignItems: 'center'
                    }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )}

            {snapshots.length === 0 ? (
              <p style={{ fontSize: 13, color: 'hsl(var(--text-meta))' }}>No snapshots taken yet.</p>
            ) : filteredSnapshots.length === 0 ? (
              <p style={{ fontSize: 13, color: 'hsl(var(--text-meta))' }}>No notes match "{noteQuery}".</p>
            ) : (
              filteredSnapshots.map(snap => (
                <SnapEntry
                  key={snap.id}
                  snap={snap}
                  threadStatus={thread.status}
                  threadId={thread.id}
                  pinnedSnapshotId={thread.pinnedSnapshotId}
                  onEdit={editSnapshot}
                  onDelete={deleteSnapshot}
                  onPin={(snapId) => pinSnapshot(thread.id, snapId)}
                  onRestore={(targetSnap) => {
                    addSnapshot(thread.id, {
                      lastAction: targetSnap.lastAction,
                      nextStep: targetSnap.nextStep,
                      blocker: targetSnap.blocker,
                      fileAttachment: targetSnap.fileAttachment
                    }, thread.status);
                  }}
                />
              ))
            )}
          </div>

          {/* Action footer */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid hsl(var(--border))',
              display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
            }}
          >
            {/* Resume note */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                className="snap-textarea"
                rows={2}
                placeholder="Add a note... (Press Enter to save)"
                value={resumeNote}
                onChange={e => setResumeNote(e.target.value)}
                onKeyDown={handleKey}
                style={{ fontSize: 13, resize: 'none' }}
              />
              {window.electronAPI && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={async () => {
                      const file = await window.electronAPI.selectFile();
                      if (file) setFileAttachment(file);
                    }}
                    className="btn-ghost"
                    style={{ height: 26, fontSize: 12, padding: '0 8px' }}
                  >
                    <Paperclip size={12} /> {fileAttachment ? 'Change' : 'Attach File'}
                  </button>
                  {fileAttachment && (
                    <span style={{ fontSize: 11, color: 'hsl(var(--text-meta))', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fileAttachment.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFileAttachment(null)}
                        style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', padding: 2, cursor: 'pointer' }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(thread.status === 'paused' || thread.status === 'stuck' || thread.status === 'delayed') && (
                <button onClick={handleResume} className="btn-primary" style={{ flex: 1, minWidth: 130, height: 36, fontSize: 13, justifyContent: 'center', background: 'hsl(var(--status-active))' }}>
                  <Play size={12} strokeWidth={2} style={{ fill: 'white' }} /> Resume
                </button>
              )}
              {thread.status !== 'paused' && (
                <button onClick={handlePause} className="btn-outline-indigo" style={{ flex: 1, minWidth: 130, height: 36, fontSize: 13, justifyContent: 'center' }}>
                  <Pause size={12} /> Park for Later
                </button>
              )}
              {thread.status !== 'stuck' && (
                <button onClick={handleStuck} className="btn-outline-amber" style={{ flex: 1, minWidth: 130, height: 36, fontSize: 13, justifyContent: 'center' }}>
                  <Ban size={12} /> Park as Stuck
                </button>
              )}
              <button onClick={handleClose} className="btn-ghost" style={{ flex: 1, minWidth: 130, height: 36, fontSize: 13 }}>
                <CheckCircle2 size={12} /> Done with thread
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

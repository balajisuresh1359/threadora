import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Ban, Play, Edit2, Copy, Check, Trash2, CheckCircle2, Pause, Flag, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../store/useTaskStore';
import { getTrackColor } from '../utils/trackColors';
import { getRelativeTime } from '../utils/timeUtils';
import { buildSnapshotCopyText, getSnapshotHandoff } from '../utils/snapshotUtils';

function SnapEntry({ snap, threadStatus, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [la, setLa] = useState(snap.lastAction || snap.note || '');
  const [ns, setNs] = useState(snap.nextStep || '');
  const [bl, setBl] = useState(snap.blocker || '');
  const [copied, setCopied] = useState(false);
  const handoff = getSnapshotHandoff(snap, threadStatus);

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
            <button onClick={() => onDelete(snap.id)} style={{ fontSize: 10, color: 'hsl(var(--destructive))', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Trash2 size={9} /> delete
            </button>
          </div>
          {snap.note && <p style={{ fontSize: 12, color: 'hsl(var(--text-body))' }}>{snap.note}</p>}
          <p style={{ fontSize: 11, color: 'hsl(var(--text-meta))', marginTop: 4 }}>{getRelativeTime(snap.capturedAt)}</p>
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
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{ fontSize: 10, color: 'hsl(var(--text-meta))', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <Edit2 size={9} /> edit
              </button>
            )}
            <button
              onClick={() => onDelete(snap.id)}
              style={{ fontSize: 10, color: 'hsl(var(--destructive))', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Trash2 size={9} /> delete
            </button>
          </div>
        </div>

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
                    <p style={{ fontSize: 13, color: 'hsl(var(--text-title))', lineHeight: 1.5, marginTop: 4 }}>
                      {snap.note || snap.lastAction}
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
          </>
        )}
      </div>
    </div>
  );
}

export function ThreadDetailDrawer({ thread, isOpen, onClose }) {
  const { updateThreadStatus, closeThread, addContextNote, editSnapshot, deleteSnapshot, acknowledgeReminder } = useTaskStore();
  const [resumeNote, setResumeNote] = useState('');
  const allSnapshots = useTaskStore(s => s.snapshots);

  // Get snapshots and sort them oldest first (ascending by time) so they appear chronologically top-to-bottom
  const snapshots = allSnapshots
    .filter(snap => snap.threadId === thread.id)
    .sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt));
  const color = getTrackColor(thread.track);

  const handleAddNote = () => {
    if (resumeNote.trim()) {
      const phase = thread.status === 'paused'
        ? 'Added while paused'
        : thread.status === 'stuck'
          ? 'Added while stuck'
          : thread.status === 'delayed'
            ? 'Added while delayed'
            : 'Active note';
      const result = addContextNote(thread.id, resumeNote, phase);
      if (result?.ok === false) {
        toast.error(result.error);
      } else {
        setResumeNote('');
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
                  <span style={{ fontSize: 12, color: 'hsl(var(--text-meta))' }}>{thread.track}</span>
                  <span style={{ fontSize: 12, color: 'hsl(var(--text-meta))' }}>·</span>
                  <span className={`status-badge status-badge-${thread.status}`}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}}/>
                    {thread.status.charAt(0).toUpperCase() + thread.status.slice(1)}
                  </span>
                  <span style={{ fontSize: 12, color: 'hsl(var(--text-meta))', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Flag size={11} /> {thread.priorityValue ?? 1000}
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

          {/* Snapshot timeline */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'hsl(var(--text-muted))', marginBottom: 14 }}>Snapshot history</p>

            {snapshots.length === 0 ? (
              <p style={{ fontSize: 13, color: 'hsl(var(--text-meta))' }}>No snapshots taken yet.</p>
            ) : (
              snapshots.map(snap => (
                <SnapEntry
                  key={snap.id}
                  snap={snap}
                  threadStatus={thread.status}
                  onEdit={editSnapshot}
                  onDelete={deleteSnapshot}
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
            <textarea
              className="snap-textarea"
              rows={2}
              placeholder="Add a note... (Press Enter to save)"
              value={resumeNote}
              onChange={e => setResumeNote(e.target.value)}
              onKeyDown={handleKey}
              style={{ fontSize: 13, resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(thread.status === 'paused' || thread.status === 'stuck' || thread.status === 'delayed') && (
                <button onClick={handleResume} className="btn-primary" style={{ flex: 1, minWidth: 130, height: 36, fontSize: 13, justifyContent: 'center', background: 'hsl(var(--status-active))' }}>
                  <Play size={12} strokeWidth={2} style={{ fill: 'white' }} /> Resume
                </button>
              )}
              {thread.status === 'delayed' && (
                <button onClick={handlePause} className="btn-outline-indigo" style={{ flex: 1, minWidth: 130, height: 36, fontSize: 13, justifyContent: 'center' }}>
                  <Pause size={12} /> Move to Paused
                </button>
              )}
              {thread.status !== 'stuck' && thread.status !== 'active' && (
                <button onClick={handleStuck} className="btn-outline-amber" style={{ flex: 1, minWidth: 130, height: 36, fontSize: 13, justifyContent: 'center' }}>
                  <Ban size={12} /> Mark Stuck
                </button>
              )}
              {thread.reminderDue && (
                <button onClick={() => { acknowledgeReminder(thread.id); onClose(); }} className="btn-primary" style={{ flex: 1, minWidth: 130, height: 36, fontSize: 13 }}>
                  <CheckCircle2 size={12} /> Acknowledge
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

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Ban, Play } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { getRelativeTime, getElapsedTime } from '../utils/timeUtils';
import { getSnapshotHandoff } from '../utils/snapshotUtils';
import { toast } from 'sonner';

export function ResumeCard({ thread, onStartWorking }) {
  const { getLatestSnapshot, addContextNote } = useTaskStore();
  const snap = getLatestSnapshot(thread.id);
  const handoff = getSnapshotHandoff(snap, thread.status);
  const [note, setNote] = useState('');

  const handleAddNote = () => {
    if (note.trim()) {
      const result = addContextNote(thread.id, note, thread.status === 'paused' ? 'Added while paused' : 'Added while stuck');
      if (result?.ok === false) toast.error(result.error);
      else setNote('');
    }
  };

  const handleResume = () => {
    handleAddNote();
    onStartWorking();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
      style={{ overflow: 'hidden' }}
    >
      <div className="resume-panel">
        {snap ? (
          <>
            {/* Time elapsed */}
            <div
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'hsl(var(--primary-subtle))',
                border: '1px solid hsl(var(--primary) / 0.15)',
                borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 16,
              }}
            >
              <Clock size={13} strokeWidth={2} style={{ color: 'hsl(var(--primary))', marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'hsl(var(--text-title))', lineHeight: 1.5 }}>
                You left this{' '}
                <strong style={{ color: 'hsl(var(--primary))' }}>{getElapsedTime(snap.capturedAt)}</strong> ago.
                <span style={{ color: 'hsl(var(--text-meta))' }}> Snapshot taken {getRelativeTime(snap.capturedAt)}.</span>
              </p>
            </div>

            {/* Context */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>Context</span>
                <p style={{ fontSize: 13, color: 'hsl(var(--text-title))', marginTop: 2, lineHeight: 1.5 }}>
                  {snap.lastAction}
                </p>
              </div>
              
              {handoff && (
                <>
                  <div style={{ height: 1, background: 'hsl(var(--border))' }} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ width: 64, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: 'hsl(var(--text-muted))', paddingTop: 2, flexShrink: 0 }}>
                      {thread.status === 'stuck' ? 'Reason' : 'Next'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      {thread.status === 'stuck' ? (
                        <Ban size={12} strokeWidth={2} style={{ color: 'hsl(var(--status-stuck))', marginTop: 3, flexShrink: 0 }} />
                      ) : (
                        <ArrowRight size={12} strokeWidth={2.5} style={{ color: 'hsl(var(--primary))', marginTop: 3, flexShrink: 0 }} />
                      )}
                      <p
                        style={{
                          fontSize: 13,
                          color: thread.status === 'stuck' ? 'hsl(var(--status-stuck))' : 'hsl(var(--text-title))',
                          lineHeight: 1.6,
                        }}
                      >
                        {handoff.value}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Resume note (optional) */}
            <textarea
              className="snap-textarea"
              rows={1}
              placeholder="Add a note... (Press Enter to save)"
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={handleKey}
              style={{
                width: '100%', fontSize: 13, resize: 'none', padding: '8px 12px', minHeight: 36,
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--surface))',
                color: 'hsl(var(--text-title))',
                outline: 'none', marginBottom: 12,
              }}
            />

            <button
              onClick={handleResume}
              className="btn-primary"
              style={{ width: '100%', height: 36, fontSize: 13, justifyContent: 'center' }}
            >
              <Play size={12} strokeWidth={2} style={{ fill: 'white' }} /> Activate
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: 13, color: 'hsl(var(--text-meta))', marginBottom: 8 }}>No snapshot recorded yet.</p>
            <textarea
              className="snap-textarea"
              rows={1}
              placeholder="Add a note... (Press Enter to save)"
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={handleKey}
              style={{
                width: '100%', fontSize: 13, resize: 'none', padding: '8px 12px', minHeight: 36,
                border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--surface))', color: 'hsl(var(--text-title))',
                outline: 'none', marginBottom: 12,
              }}
            />
            <button onClick={handleResume} className="btn-primary" style={{ height: 34, fontSize: 13 }}>
              <Play size={12} strokeWidth={2} style={{ fill: 'white' }} /> Activate
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

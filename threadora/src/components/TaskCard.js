import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Camera, Play, GripVertical, AlertTriangle, Clock, Timer } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useTaskStore } from '../store/useTaskStore';
import { getRelativeTime } from '../utils/timeUtils';
import { ResumeCard } from './ResumeCard';

const TYPE_COLORS = {
  dev:    'hsl(var(--type-dev))',
  design: 'hsl(var(--type-design))',
  comms:  'hsl(var(--type-comms))',
  other:  'hsl(var(--type-other))',
};

const TYPE_LABELS = {
  dev:    'Dev',
  design: 'Design',
  comms:  'Comms',
  other:  'Other',
};

// ─── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    active:  { label: 'Active',  cls: 'status-badge-active' },
    paused:  { label: 'Paused',  cls: 'status-badge-paused' },
    blocked: { label: 'Blocked', cls: 'status-badge-blocked' },
  };
  const { label, cls } = cfg[status] ?? cfg.active;
  return (
    <span className={`status-badge ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

// ─── Focus timer ──────────────────────────────────────────────
function formatTimer(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function FocusTimer({ activeStartedAt }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeStartedAt) return;
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(activeStartedAt).getTime()) / 1000);
      setElapsed(Math.max(0, diff));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeStartedAt]);

  if (!activeStartedAt) return null;

  return (
    <span className="focus-timer">
      <Timer size={10} strokeWidth={2} />
      {formatTimer(elapsed)}
    </span>
  );
}

// ─── Task Card ──────────────────────────────────────────────
export function TaskCard({ task, rank, onSnapshot, isFocused }) {
  const archiveTask       = useTaskStore(s => s.archiveTask);
  const deleteTask        = useTaskStore(s => s.deleteTask);
  const updateTaskStatus  = useTaskStore(s => s.updateTaskStatus);
  const getLatestSnapshot = useTaskStore(s => s.getLatestSnapshot);
  const [showResume, setShowResume] = useState(false);

  // Close resume panel when task becomes active again
  useEffect(() => {
    if (task.status === 'active') setShowResume(false);
  }, [task.status]);

  const snapshot = getLatestSnapshot(task.id);

  const cardClass = [
    'task-card relative group',
    task.status === 'paused'  ? 'task-card-paused'  : '',
    task.status === 'blocked' ? 'task-card-blocked' : '',
  ].filter(Boolean).join(' ');

  const handleResumeClick = () => {
    if (task.status === 'paused' || task.status === 'blocked') {
      setShowResume(prev => !prev);
    }
  };

  const handleStartWorking = () => {
    updateTaskStatus(task.id, 'active');
    setShowResume(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      className={isFocused ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background rounded-[var(--radius)]' : ''}
    >
      <div className={cardClass}>
        <div className="flex items-start gap-3">

          {/* Left: drag + rank circle */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
            <span className="drag-handle">
              <GripVertical size={12} />
            </span>
            <span className="rank-circle">{rank}</span>
          </div>

          {/* Centre: all text content */}
          <div className="flex-1 min-w-0">

            {/* Row 1: title + badge */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h3
                className="leading-snug font-semibold text-primary-text"
                style={{ fontSize: '15px' }}
              >
                {task.title}
              </h3>
              <StatusBadge status={task.status} />
            </div>

            {/* Row 2: type · timestamp · focus timer */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Type */}
              <div className="flex items-center gap-1.5">
                <span
                  className="type-dot"
                  style={{ backgroundColor: TYPE_COLORS[task.type] }}
                />
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                  {TYPE_LABELS[task.type]}
                </span>
              </div>

              {/* Snapshot timestamp */}
              {snapshot && (
                <div className="flex items-center gap-1" style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                  <Clock size={10} strokeWidth={1.8} />
                  <span>{getRelativeTime(snapshot.capturedAt)}</span>
                </div>
              )}
              {!snapshot && task.status === 'active' && (
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>No snapshot yet</span>
              )}

              {/* Focus timer - only for active tasks */}
              {task.status === 'active' && task.activeStartedAt && (
                <FocusTimer activeStartedAt={task.activeStartedAt} />
              )}
            </div>

            {/* Row 3: next step preview */}
            {snapshot?.nextStep && (
              <div className="flex items-start gap-1 mt-2">
                <span
                  className="flex-shrink-0 mt-px"
                  style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}
                >
                  Next:
                </span>
                <p
                  className="truncate leading-relaxed"
                  style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}
                >
                  {snapshot.nextStep}
                </p>
              </div>
            )}

            {/* Blocker preview (blocked tasks only) */}
            {task.status === 'blocked' && snapshot?.blocker && (
              <div className="flex items-start gap-1.5 mt-1.5">
                <AlertTriangle
                  size={11}
                  strokeWidth={2}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: 'hsl(var(--status-blocked))' }}
                />
                <p
                  className="truncate leading-relaxed"
                  style={{ fontSize: '12px', color: 'hsl(var(--status-blocked))' }}
                >
                  {snapshot.blocker}
                </p>
              </div>
            )}
          </div>

          {/* Right: CTA + overflow */}
          <div className="flex items-center gap-1.5 flex-shrink-0 self-start">
            {task.status === 'active' ? (
              <button
                onClick={() => onSnapshot(task)}
                className="btn-snapshot"
              >
                <Camera size={11} strokeWidth={2} />
                Snapshot
              </button>
            ) : (
              <button
                onClick={handleResumeClick}
                className={`btn-resume ${showResume ? 'btn-resume-active' : ''}`}
              >
                <Play size={10} strokeWidth={2} />
                Resume
              </button>
            )}

            {/* Overflow */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Task options"
                >
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {task.status === 'active' && (
                  <DropdownMenuItem
                    onClick={() => updateTaskStatus(task.id, 'blocked')}
                    className="text-xs"
                  >
                    <AlertTriangle size={12} className="mr-2" style={{ color: 'hsl(var(--status-blocked))' }} />
                    Mark as Blocked
                  </DropdownMenuItem>
                )}
                {task.status === 'blocked' && (
                  <DropdownMenuItem
                    onClick={() => updateTaskStatus(task.id, 'active')}
                    className="text-xs"
                  >
                    Mark as Active
                  </DropdownMenuItem>
                )}
                {task.status === 'paused' && (
                  <DropdownMenuItem
                    onClick={() => updateTaskStatus(task.id, 'blocked')}
                    className="text-xs"
                  >
                    <AlertTriangle size={12} className="mr-2" style={{ color: 'hsl(var(--status-blocked))' }} />
                    Mark as Blocked
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => archiveTask(task.id)} className="text-xs">
                  Archive task
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => deleteTask(task.id)}
                  className="text-xs text-destructive focus:text-destructive"
                >
                  Delete permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Resume panel (inline accordion) */}
      <AnimatePresence>
        {showResume && (
          <ResumeCard task={task} onStartWorking={handleStartWorking} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

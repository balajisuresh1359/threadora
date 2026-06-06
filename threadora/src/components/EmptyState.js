import React from 'react';
import { Layers, Play, Pause, Ban, PlusCircle, Flag, Clock, Bell } from 'lucide-react';

const TAB_CONFIGS = {
  all:    { icon: Layers,        headline: 'No threads yet',              sub: 'Start tracking your first thread.' },
  active: { icon: Play,          headline: 'No active threads right now', sub: 'Resume a paused thread or start a new one.' },
  priority: { icon: Flag,        headline: 'No priority threads yet',     sub: 'Assign a priority number to bring work into focus.' },
  paused: { icon: Pause,         headline: 'Nothing paused',              sub: 'Take a snapshot to pause and preserve your context.' },
  stuck:  { icon: Ban,           headline: 'Nothing stuck - nice!',       sub: 'If you hit a blocker, mark the thread as Stuck.' },
  delayed:{ icon: Clock,         headline: 'No delayed threads',          sub: 'Completed timers will land here for a clean follow-up.' },
  nudges: { icon: Bell,          headline: 'No nudges due',               sub: 'Reminder-ready threads will wait here until acknowledged.' },
};

export function EmptyState({ tab, onAddThread }) {
  const cfg = TAB_CONFIGS[tab] ?? TAB_CONFIGS.all;
  const Icon = cfg.icon;
  const isAll = tab === 'all';

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
      }}
    >
      {/* Circle illustration */}
      <div
        style={{
          width: 80, height: 80, borderRadius: '50%', marginBottom: 24,
          border: '2px dashed hsl(var(--border-strong))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'hsl(var(--surface))',
          position: 'relative',
        }}
      >
        <Icon size={30} strokeWidth={1.5} style={{ color: 'hsl(var(--text-muted))' }} />
      </div>

      <h2
        style={{
          fontSize: 18, fontWeight: 600, color: 'hsl(var(--text-title))',
          marginBottom: 8, lineHeight: 1.3,
        }}
      >
        {cfg.headline}
      </h2>
      <p
        style={{
          fontSize: 13, color: 'hsl(var(--text-meta))',
          maxWidth: 280, lineHeight: 1.6, marginBottom: isAll ? 28 : 0,
        }}
      >
        {cfg.sub}
      </p>

      {isAll && (
        <button
          onClick={onAddThread}
          className="btn-primary"
          style={{ height: 36, fontSize: 13, padding: '0 20px', gap: 6 }}
        >
          <PlusCircle size={14} />
          Start your first thread →
        </button>
      )}
    </div>
  );
}

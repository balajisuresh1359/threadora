import React, { useEffect } from 'react';
import { Download, Upload, Type } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function Header({ onShowShortcuts }) {
  const exportData = useTaskStore(s => s.exportData);
  const importData = useTaskStore(s => s.importData);
  const threads    = useTaskStore(s => s.threads);
  const settings   = useTaskStore(s => s.settings);
  const updateSettings = useTaskStore(s => s.updateSettings);
  const active     = threads.filter(t => !t.closedAt && t.status === 'active').length;
  const total      = threads.filter(t => !t.closedAt).length;

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = importData(event.target.result);
        if (success) {
          window.location.reload(); // Reload to apply new state cleanly
        } else {
          alert('Failed to import JSON file. Please check the format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Apply dark theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.setProperty('--app-font', settings.fontFamily || 'Inter');
  }, [settings.fontFamily]);

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      <div
        style={{
          maxWidth: 760, margin: '0 auto', padding: '0 24px',
          height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'hsl(var(--surface-raised))',
              // border: '1px solid hsl(var(--border))',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img src="/threadmark-icon2.png" alt="Threadora" style={{ width: 28, height: 28, objectFit: 'cover' }} />
          </div>
          <span
            style={{
              fontSize: 15, fontWeight: 700,
              color: 'hsl(var(--primary))',
              letterSpacing: '-0.02em',
            }}
          >
            Threadora
          </span>
          {total > 0 && (
            <span
              style={{
                fontSize: 11, fontWeight: 500,
                color: 'hsl(var(--text-meta))',
                background: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-pill)',
                padding: '2px 8px',
              }}
            >
              {active} active
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TooltipProvider delayDuration={400}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 6, color: 'hsl(var(--text-meta))' }}>
              <Type size={14} />
              <select
                value={settings.fontFamily || 'Inter'}
                onChange={e => updateSettings({ fontFamily: e.target.value })}
                className="compact-select"
                title="Font"
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
            </div>
            {/* Import JSON */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleImportClick}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', background: 'transparent',
                    color: 'hsl(var(--text-meta))',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-muted hover:text-foreground"
                >
                  <Upload size={14} strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>Import JSON</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={exportData}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', background: 'transparent',
                    color: 'hsl(var(--text-meta))',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-muted hover:text-foreground"
                >
                  <Download size={14} strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>Export JSON</p></TooltipContent>
            </Tooltip>

            {/* <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onShowShortcuts}
                  style={{
                    height: 28, padding: '0 10px',
                    display: 'flex', alignItems: 'center', gap: 5,
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    background: 'transparent',
                    color: 'hsl(var(--text-meta))',
                    fontSize: 11, fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  className="hover:bg-muted hover:text-foreground"
                >
                  <span style={{ fontWeight: 700 }}>?</span>
                  <span style={{ display: 'none' }} className="sm:inline">Shortcuts</span>
                </button>
              </TooltipTrigger>
              <TooltipContent><p>Keyboard shortcuts</p></TooltipContent>
            </Tooltip> */}
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}

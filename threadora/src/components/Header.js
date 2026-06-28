import React, { useEffect } from 'react';
import { Download, Upload } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const THEMES = {
  default: {
    '--background': '0 0% 4%',
    '--surface': '0 0% 9%',
    '--surface-raised': '0 0% 12%',
    '--foreground': '0 0% 98%',
    '--text-title': '0 0% 98%',
    '--text-body': '0 0% 65%',
    '--text-meta': '0 0% 62%',
    '--text-muted': '0 0% 46%',
    '--border': '0 0% 15%',
    '--border-strong': '0 0% 20%',
    '--primary': '0 0% 96%',
    '--primary-foreground': '0 0% 9%',
    '--muted': '0 0% 12%'
  },
  slate: {
    '--background': '222 47% 11%',
    '--surface': '223 47% 16%',
    '--surface-raised': '223 47% 22%',
    '--foreground': '210 40% 98%',
    '--text-title': '210 40% 98%',
    '--text-body': '215 20% 75%',
    '--text-meta': '215 20% 65%',
    '--text-muted': '215 16% 47%',
    '--border': '217 32% 20%',
    '--border-strong': '217 32% 26%',
    '--primary': '210 40% 96%',
    '--primary-foreground': '222 47% 11%',
    '--muted': '217 32% 17%'
  },
  ocean: {
    '--background': '244 55% 8%',
    '--surface': '244 45% 13%',
    '--surface-raised': '244 45% 18%',
    '--foreground': '210 40% 98%',
    '--text-title': '210 40% 98%',
    '--text-body': '215 20% 75%',
    '--text-meta': '215 20% 65%',
    '--text-muted': '215 16% 47%',
    '--border': '244 30% 20%',
    '--border-strong': '244 30% 25%',
    '--primary': '210 40% 96%',
    '--primary-foreground': '244 55% 8%',
    '--muted': '244 30% 16%'
  },
  sage: {
    '--background': '160 50% 6%',
    '--surface': '160 40% 10%',
    '--surface-raised': '160 40% 15%',
    '--foreground': '120 20% 95%',
    '--text-title': '120 20% 95%',
    '--text-body': '160 15% 70%',
    '--text-meta': '160 15% 60%',
    '--text-muted': '160 10% 45%',
    '--border': '160 30% 16%',
    '--border-strong': '160 30% 22%',
    '--primary': '120 20% 90%',
    '--primary-foreground': '160 50% 6%',
    '--muted': '160 30% 13%'
  },
  'light-beige': {
    '--background': '36 25% 94%',
    '--surface': '0 0% 100%',
    '--surface-raised': '36 20% 90%',
    '--foreground': '20 14% 10%',
    '--text-title': '20 14% 10%',
    '--text-body': '20 12% 18%',
    '--text-meta': '20 10% 30%',
    '--text-muted': '20 8% 42%',
    '--border': '36 15% 78%',
    '--border-strong': '36 15% 65%',
    '--primary': '20 15% 12%',
    '--primary-foreground': '0 0% 98%',
    '--muted': '36 20% 88%',
    '--card': '0 0% 100%',
    '--card-foreground': '20 14% 10%',
    '--primary-subtle': '36 25% 94%',
    '--primary-border-soft': '36 15% 78%',
    '--status-active': '142 60% 30%',
    '--status-active-bg': '142 60% 92%',
    '--status-paused': '0 0% 35%',
    '--status-paused-bg': '0 0% 90%',
    '--status-stuck': '20 90% 25%',
    '--status-stuck-bg': '35 90% 92%',
    '--status-stuck-accent': '20 90% 40%',
    '--status-stuck-card': '35 90% 92%',
    '--status-delayed': '210 80% 35%',
    '--status-delayed-bg': '210 80% 92%',
    '--status-delayed-card': '210 80% 92%',
    '--status-delayed-border': '210 80% 35%'
  },
  'light-gray': {
    '--background': '210 20% 97%',
    '--surface': '0 0% 100%',
    '--surface-raised': '210 15% 91%',
    '--foreground': '210 25% 8%',
    '--text-title': '210 25% 8%',
    '--text-body': '210 15% 16%',
    '--text-meta': '210 15% 28%',
    '--text-muted': '210 15% 42%',
    '--border': '210 15% 80%',
    '--border-strong': '210 15% 68%',
    '--primary': '210 25% 10%',
    '--primary-foreground': '0 0% 98%',
    '--muted': '210 15% 89%',
    '--card': '0 0% 100%',
    '--card-foreground': '210 25% 8%',
    '--primary-subtle': '210 20% 95%',
    '--primary-border-soft': '210 15% 80%',
    '--status-active': '142 60% 30%',
    '--status-active-bg': '142 60% 92%',
    '--status-paused': '0 0% 35%',
    '--status-paused-bg': '0 0% 90%',
    '--status-stuck': '20 90% 25%',
    '--status-stuck-bg': '35 90% 92%',
    '--status-stuck-accent': '20 90% 40%',
    '--status-stuck-card': '35 90% 92%',
    '--status-delayed': '210 80% 35%',
    '--status-delayed-bg': '210 80% 92%',
    '--status-delayed-card': '210 80% 92%',
    '--status-delayed-border': '210 80% 35%'
  }
};

export function Header() {
  const exportData = useTaskStore(s => s.exportData);
  const importData = useTaskStore(s => s.importData);
  const threads    = useTaskStore(s => s.threads);
  const activeTab  = useTaskStore(s => s.activeTab);
  const settings   = useTaskStore(s => s.settings);
  const updateSettings = useTaskStore(s => s.updateSettings);
  const active     = threads.filter(t => !t.closedAt && t.status === 'active').length;
  const total      = threads.filter(t => !t.closedAt).length;

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        importData(evt.target.result);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Apply font and theme options
  useEffect(() => {
    // Clear any previous theme styles set on documentElement to prevent leaks
    document.documentElement.removeAttribute('style');

    document.documentElement.style.setProperty('--app-font', settings.fontFamily || "'Courier New', monospace");
    const themeName = settings.bgTheme || 'default';
    const themeProps = THEMES[themeName] || THEMES.default;
    Object.entries(themeProps).forEach(([prop, val]) => {
      document.documentElement.style.setProperty(prop, val);
    });

    const isLight = themeName.startsWith('light');
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');

    // Stuck Card variables
    const stuckColor = settings.stuckCardColor || 'active';
    if (stuckColor === 'active') {
      document.documentElement.style.setProperty('--stuck-card-accent', 'transparent');
      document.documentElement.style.setProperty('--stuck-card-bg', 'hsl(var(--surface))');
    } else {
      const colors = {
        orange: isLight ? { accent: '35 80% 50%', bg: '35 80% 95%' } : { accent: '35 80% 60%', bg: '35 80% 8%' },
        red: isLight ? { accent: '0 80% 50%', bg: '0 80% 95%' } : { accent: '0 80% 60%', bg: '0 80% 8%' },
        purple: isLight ? { accent: '270 80% 50%', bg: '270 80% 95%' } : { accent: '270 80% 60%', bg: '270 80% 8%' },
      };
      const vals = colors[stuckColor] || colors.orange;
      document.documentElement.style.setProperty('--stuck-card-accent', `hsl(${vals.accent})`);
      document.documentElement.style.setProperty('--stuck-card-bg', `hsl(${vals.bg})`);
    }

    // Parked Card variables
    const parkedColor = settings.parkedCardColor || 'active';
    if (parkedColor === 'active') {
      document.documentElement.style.setProperty('--parked-card-accent', 'transparent');
      document.documentElement.style.setProperty('--parked-card-bg', 'hsl(var(--surface))');
      document.documentElement.style.setProperty('--parked-card-opacity', '1');
    } else {
      const colors = {
        gray: isLight ? { accent: '0 0% 50%', bg: '0 0% 93%', opacity: '0.92' } : { accent: '0 0% 50%', bg: '0 0% 12%', opacity: '0.92' },
        blue: isLight ? { accent: '210 80% 50%', bg: '210 80% 95%', opacity: '1' } : { accent: '210 80% 60%', bg: '210 80% 8%', opacity: '1' },
        green: isLight ? { accent: '142 60% 40%', bg: '142 60% 95%', opacity: '1' } : { accent: '142 60% 45%', bg: '142 60% 8%', opacity: '1' },
      };
      const vals = colors[parkedColor] || colors.gray;
      document.documentElement.style.setProperty('--parked-card-accent', `hsl(${vals.accent})`);
      document.documentElement.style.setProperty('--parked-card-bg', `hsl(${vals.bg})`);
      document.documentElement.style.setProperty('--parked-card-opacity', vals.opacity);
    }
  }, [settings.fontFamily, settings.bgTheme, settings.stuckCardColor, settings.parkedCardColor]);

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'hsl(var(--surface) / 0.94)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid hsl(var(--border))',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
      }}
    >
      <div
        className="app-header-inner"
        style={{
          maxWidth: 760, margin: '0 auto', padding: '0 24px',
          height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div className="app-header-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            <img src="/threadmark-icon.png" alt="Threadora" style={{ width: 28, height: 28, objectFit: 'cover' }} />
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
              className="header-active-count"
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
            {/* Import JSON */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleImport}
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

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('threadmark:show-shortcuts'))}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', background: 'transparent',
                    color: 'hsl(var(--text-meta))',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 'bold',
                  }}
                  className="hover:bg-muted hover:text-foreground"
                >
                  ?
                </button>
              </TooltipTrigger>
              <TooltipContent><p>Shortcuts</p></TooltipContent>
            </Tooltip>

          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}

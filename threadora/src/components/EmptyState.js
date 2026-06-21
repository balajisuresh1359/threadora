import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const s = 'hsl(var(--text-muted))';
const a = 'hsl(var(--primary))';
const f = 'hsl(var(--border-strong))';
const bg = 'hsl(var(--background))';


const CatInBox = () => (
  <svg viewBox="0 0 130 120" width={200} height={185} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 60 L18 100 L112 100 L112 60" stroke={s} strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <line x1="18" y1="100" x2="112" y2="100" stroke={s} strokeWidth="2"/>
    <path d="M18 60 L10 46" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M18 60 L44 52" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M112 60 L120 46" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M112 60 L86 52" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="18" y1="60" x2="112" y2="60" stroke={s} strokeWidth="2"/>
    <rect x="34" y="54" width="18" height="12" rx="6" fill={f} stroke={s} strokeWidth="1.4"/>
    <rect x="76" y="54" width="18" height="12" rx="6" fill={f} stroke={s} strokeWidth="1.4"/>
    <ellipse cx="65" cy="38" rx="20" ry="17" fill={f} stroke={s} strokeWidth="1.6"/>
    <path d="M49 27 L45 12 L58 24Z" fill={f} stroke={s} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M74 24 L76 10 L84 24Z" fill={f} stroke={s} strokeWidth="1.4" strokeLinejoin="round"/>
    <ellipse cx="57" cy="37" rx="3.5" ry="4" fill={bg} stroke={s} strokeWidth="1"/>
    <ellipse cx="73" cy="37" rx="3.5" ry="4" fill={bg} stroke={s} strokeWidth="1"/>
    <ellipse cx="57.5" cy="37" rx="1.5" ry="2" fill={s}/>
    <ellipse cx="73.5" cy="37" rx="1.5" ry="2" fill={s}/>
    <path d="M64 43 L65.5 45 L67 43Z" fill={a}/>
    <line x1="50" y1="43" x2="32" y2="40" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="50" y1="45" x2="32" y2="46" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="78" y1="43" x2="96" y2="40" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="78" y1="45" x2="96" y2="46" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
  </svg>
);

const CatWalking = () => (
  <svg viewBox="0 0 140 110" width={210} height={165} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="78" cy="58" rx="36" ry="18" fill={f} stroke={s} strokeWidth="1.6"/>
    <path d="M112 48 Q124 30 118 16" stroke={s} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    <path d="M54 70 L46 90" stroke={s} strokeWidth="4.5" strokeLinecap="round"/>
    <path d="M66 74 L62 94" stroke={s} strokeWidth="4.5" strokeLinecap="round"/>
    <path d="M90 74 L98 92" stroke={s} strokeWidth="4.5" strokeLinecap="round"/>
    <path d="M102 70 L112 86" stroke={s} strokeWidth="4.5" strokeLinecap="round"/>
    <ellipse cx="45" cy="92" rx="7" ry="4" fill={f} stroke={s} strokeWidth="1.4"/>
    <ellipse cx="62" cy="96" rx="7" ry="4" fill={f} stroke={s} strokeWidth="1.4"/>
    <ellipse cx="99" cy="94" rx="7" ry="4" fill={f} stroke={s} strokeWidth="1.4"/>
    <ellipse cx="113" cy="88" rx="7" ry="4" fill={f} stroke={s} strokeWidth="1.4"/>
    <g transform="rotate(20 42 44)">
      <ellipse cx="42" cy="44" rx="16" ry="14" fill={f} stroke={s} strokeWidth="1.6"/>
      <path d="M30 34 L27 22 L38 31Z" fill={f} stroke={s} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M50 31 L54 20 L58 31Z" fill={f} stroke={s} strokeWidth="1.4" strokeLinejoin="round"/>
      <ellipse cx="36" cy="43" rx="3.5" ry="4" fill={bg} stroke={s} strokeWidth="1"/>
      <ellipse cx="48" cy="43" rx="3.5" ry="4" fill={bg} stroke={s} strokeWidth="1"/>
      <ellipse cx="36.5" cy="43" rx="1.6" ry="2" fill={s}/>
      <ellipse cx="48.5" cy="43" rx="1.6" ry="2" fill={s}/>
      <path d="M41 49 L42.5 51 L44 49Z" fill={a}/>
    </g>
  </svg>
);


const CatIgnoring = () => (
  <svg viewBox="0 0 120 130" width={200} height={217} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="90" rx="22" ry="28" fill={f} stroke={s} strokeWidth="1.6"/>
    <ellipse cx="48" cy="114" rx="8" ry="5" fill={f} stroke={s} strokeWidth="1.4"/>
    <ellipse cx="68" cy="114" rx="8" ry="5" fill={f} stroke={s} strokeWidth="1.4"/>
    <path d="M82 96 Q96 104 88 118 Q80 126 70 118" stroke={s} strokeWidth="3.2" strokeLinecap="round" fill="none"/>
    <rect x="52" y="56" width="16" height="14" rx="4" fill={f}/>
    <ellipse cx="62" cy="44" rx="20" ry="18" fill={f} stroke={s} strokeWidth="1.6"/>
    <path d="M46 34 L42 18 L56 30Z" fill={f} stroke={s} strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M70 30 L74 14 L82 28Z" fill={f} stroke={s} strokeWidth="1.4" strokeLinejoin="round"/>
    <ellipse cx="55" cy="43" rx="4" ry="4.5" fill={bg} stroke={s} strokeWidth="1"/>
    <ellipse cx="70" cy="42" rx="4" ry="4.5" fill={bg} stroke={s} strokeWidth="1"/>
    <ellipse cx="56.5" cy="43" rx="2" ry="2.5" fill={s}/>
    <ellipse cx="71.5" cy="42" rx="2" ry="2.5" fill={s}/>
    <path d="M61 50 L62.5 52 L64 50Z" fill={a}/>
    <line x1="65" y1="50" x2="84" y2="47" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="65" y1="52" x2="84" y2="53" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="48" y1="50" x2="34" y2="48" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="48" y1="52" x2="34" y2="53" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
  </svg>
);

const CatThinking = () => (
  <svg viewBox="0 0 120 130" width={200} height={217} fill="none" xmlns="http://www.w3.org/2000/svg">

    {/* Tail */}
    <path
      d="M82 96 Q104 92 102 114 Q100 126 86 122"
      stroke={s}
      strokeWidth="3.2"
      strokeLinecap="round"
      fill="none"
    />

    {/* Body */}
    <ellipse cx="60" cy="88" rx="24" ry="30" fill={f} stroke={s} strokeWidth="1.6"/>

    {/* Rear paws */}
    <ellipse cx="47" cy="116" rx="8" ry="5" fill={f} stroke={s} strokeWidth="1.4"/>
    <ellipse cx="70" cy="116" rx="8" ry="5" fill={f} stroke={s} strokeWidth="1.4"/>

{/* Left arm */}
<path
  d="M72 74
     Q75 68 74 62"
  stroke={s}
  strokeWidth="4.5"
  strokeLinecap="round"
  fill="none"
/>

{/* Chin paw */}
<ellipse
  cx="72"
  cy="59"
  rx="5.5"
  ry="4"
  transform="rotate(-10 72 59)"
  fill={f}
  stroke={s}
  strokeWidth="1.4"
/>

{/* Right arm */}
<path
  d="M50 76
     Q54 82 57 87"
  stroke={s}
  strokeWidth="4"
  strokeLinecap="round"
/>

{/* Right paw */}
<ellipse
  cx="59"
  cy="89"
  rx="5"
  ry="3.8"
  transform="rotate(18 59 89)"
  fill={f}
  stroke={s}
  strokeWidth="1.4"
/>

    {/* Neck */}
    <rect x="53" y="56" width="18" height="15" rx="4" fill={f}/>

    {/* Head */}
    <ellipse cx="62" cy="42" rx="20" ry="18" fill={f} stroke={s} strokeWidth="1.6"/>

    {/* Ears */}
    <path
      d="M46 33 L42 18 L56 29Z"
      fill={f}
      stroke={s}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />

    <path
      d="M69 29 L74 14 L82 27Z"
      fill={f}
      stroke={s}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />

    {/* Eyes looking up */}
    <ellipse cx="55" cy="42" rx="4" ry="4.5" fill={bg} stroke={s} strokeWidth="1"/>
    <ellipse cx="70" cy="42" rx="4" ry="4.5" fill={bg} stroke={s} strokeWidth="1"/>

    <ellipse cx="57" cy="40" rx="1.8" ry="2.3" fill={s}/>
    <ellipse cx="72" cy="40" rx="1.8" ry="2.3" fill={s}/>

    {/* Eyebrows */}
    <path d="M50 35 Q55 32 59 35" stroke={s} strokeWidth="1.2" fill="none"/>
    <path d="M66 35 Q71 31 75 34" stroke={s} strokeWidth="1.2" fill="none"/>

    {/* Nose */}
    <path d="M61 50 L62.5 52 L64 50Z" fill={a}/>

    {/* Thinking mouth */}
    <path
      d="M61 54 Q65 57 67 54"
      stroke={s}
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />

    {/* Whiskers */}
    <line x1="65" y1="50" x2="84" y2="47" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="65" y1="52" x2="84" y2="53" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="48" y1="50" x2="34" y2="48" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="48" y1="52" x2="34" y2="53" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>

    {/* Thought bubble */}
    <circle cx="92" cy="36" r="4" fill={f} stroke={s} strokeWidth="1"/>
    <circle cx="100" cy="26" r="6" fill={f} stroke={s} strokeWidth="1"/>
    <circle cx="110" cy="16" r="8" fill={f} stroke={s} strokeWidth="1"/>

  </svg>
);

const CatCoding = () => (
  <svg viewBox="0 0 140 130" width={200} height={185} fill="none">

    {/* Tail */}
    <path
      d="M96 95 Q116 95 114 115 Q112 126 98 122"
      stroke={s}
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />

    {/* Body behind laptop */}
    <ellipse
      cx="72"
      cy="88"
      rx="25"
      ry="30"
      fill={f}
      stroke={s}
      strokeWidth="1.6"
    />

    {/* Feet */}
    <ellipse cx="61" cy="114" rx="8" ry="5" fill={f} stroke={s} strokeWidth="1.4"/>
    <ellipse cx="81" cy="114" rx="8" ry="5" fill={f} stroke={s} strokeWidth="1.4"/>

    {/* Neck */}
    <rect x="64" y="54" width="14" height="12" rx="4" fill={f}/>

    {/* Head */}
    <ellipse cx="71" cy="41" rx="20" ry="18" fill={f} stroke={s} strokeWidth="1.6"/>

    {/* Ears */}
    <path d="M55 30 L51 14 L65 26Z" fill={f} stroke={s} strokeWidth="1.4"/>
    <path d="M79 26 L84 10 L92 24Z" fill={f} stroke={s} strokeWidth="1.4"/>

    {/* Eyes */}
    <ellipse cx="64" cy="39" rx="4" ry="4.5" fill={bg} stroke={s}/>
    <ellipse cx="79" cy="38" rx="4" ry="4.5" fill={bg} stroke={s}/>
    <ellipse cx="65.5" cy="39" rx="2" ry="2.5" fill={s}/>
    <ellipse cx="80.5" cy="38" rx="2" ry="2.5" fill={s}/>

    {/* Nose */}
    <path d="M70 46 L71.5 48 L73 46Z" fill={a}/>

    {/* Smile */}
    <path
      d="M68 52 Q71 54 74 52"
      stroke={s}
      strokeWidth="1.2"
      fill="none"
    />

    {/* Whiskers */}
    <line x1="74" y1="46" x2="92" y2="43" stroke={s}/>
    <line x1="74" y1="48" x2="92" y2="49" stroke={s}/>
    <line x1="58" y1="46" x2="44" y2="44" stroke={s}/>
    <line x1="58" y1="48" x2="44" y2="49" stroke={s}/>



    <rect
      x="28"
      y="88"
      width="60"
      height="20"
      rx="4"
      fill={f}
      stroke={s}
      strokeWidth="1.6"
    />

    {/* Code */}
    {/* <path d="M48 70 L44 74 L48 78" stroke={s} strokeWidth="1.8"/> */}
    {/* <path d="M68 70 L72 74 L68 78" stroke={s} strokeWidth="1.8"/> */}
    {/* <line x1="54" y1="74" x2="62" y2="74" stroke={s} strokeWidth="1.8"/> */}

    {/* Paws resting on keyboard */}
    <ellipse
      cx="60"
      cy="88"
      rx="4"
      ry="3"
      fill={f}
      stroke={s}
      strokeWidth="1.4"
    />

    <ellipse
      cx="71"
      cy="88"
      rx="4"
      ry="3"
      fill={f}
      stroke={s}
      strokeWidth="1.4"
    />
  </svg>
);



export const ALL_CATS = [
  CatIgnoring, CatWalking, CatInBox, CatCoding, CatThinking
];

const TAB_CONFIGS = {
  all:    { headline: 'No threads yet',          sub: 'Start tracking your thread...' },
  active: { headline: 'No active threads',       sub: 'Resume a parked thread or start a new one...' },
  parked: { headline: 'Nothing saved for later', sub: 'Paused and stuck threads will appear here...' },
  nudges: { headline: 'No reminders yet',        sub: 'Reminders will appear here when they are ready...' },
};

export function EmptyState({ tab, onAddThread }) {
  const cfg = TAB_CONFIGS[tab] ?? TAB_CONFIGS.all;
  const isAll = tab === 'all';

  const [CatIllustration] = useState(
    () => ALL_CATS[Math.floor(Math.random() * ALL_CATS.length)],
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <CatIllustration />
      </div>

      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'hsl(var(--text-title))',
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {cfg.headline}
      </h2>

      <p
        style={{
          fontSize: 13,
          color: 'hsl(var(--text-meta))',
          maxWidth: 280,
          lineHeight: 1.6,
          marginBottom: isAll ? 28 : 0,
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
          Create a new thread →
        </button>
      )}
    </div>
  );
}
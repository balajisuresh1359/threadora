import React from 'react';
import { WORK_EMOJIS } from '../utils/emojis';

export function EmojiPickerCompact({ isOpen, onSelect, onClose, anchorEl }) {
  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 39 }} />
      <div
        style={{
          position: 'absolute',
          zIndex: 40,
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-dropdown)',
          padding: 8,
          top: 'calc(100% + 6px)',
          left: 0,
        }}
      >
        <div className="emoji-grid">
          {WORK_EMOJIS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => { onSelect(emoji); onClose(); }}
              className="emoji-btn"
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

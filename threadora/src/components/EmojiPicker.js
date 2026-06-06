import React from 'react';
import { WORK_EMOJIS } from '../utils/emojis';

export function EmojiPicker({ isOpen, onSelect, onClose, position = 'left' }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 39,
        }}
      />
      
      {/* Picker */}
      <div
        className="emoji-picker-compact"
        style={{
          [position]: 0,
          top: 'calc(100% + 6px)',
        }}
      >
        <div className="emoji-grid">
          {WORK_EMOJIS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
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

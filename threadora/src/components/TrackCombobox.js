import React, { useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';
import { getTrackColor } from '../utils/trackColors';

const MAX_TRACKS = 4;

export function TrackCombobox({
  tracks,
  value,
  onChange,
  onCreateTrack,
  allLabel = null,
  placeholder = 'Select track',
  width = 220,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim();
  const hasExactMatch = tracks.some(track => track.toLowerCase() === trimmedQuery.toLowerCase());
  const arrValue = Array.isArray(value) ? value : (value ? [value] : []);
  const atLimit = arrValue.length >= MAX_TRACKS;

  const handleSelect = (nextValue) => {
    if (nextValue === null) {
      onChange([]);
      setOpen(false);
      setQuery('');
      return;
    }
    const current = Array.isArray(value) ? value : (value ? [value] : []);
    let nextArr;
    if (current.includes(nextValue)) {
      nextArr = current.filter(v => v !== nextValue);
    } else {
      if (current.length >= MAX_TRACKS) return; // cap at 4
      nextArr = [...current, nextValue];
    }
    onChange(nextArr);
    // don't close for multi-select
  };

  const handleCreate = () => {
    if (!trimmedQuery || !onCreateTrack) return;
    onCreateTrack(trimmedQuery);
    const current = Array.isArray(value) ? value : (value ? [value] : []);
    onChange([...current, trimmedQuery.trim()]);
    setOpen(false);
    setQuery('');
  };

  const showCreate = Boolean(onCreateTrack && trimmedQuery && !hasExactMatch && !atLimit);
  const displayLabel = arrValue.length > 0 ? arrValue.join(', ') : allLabel || placeholder;
  const displayColor = arrValue.length === 1 ? getTrackColor(arrValue[0]) : 'hsl(var(--text-meta))';
  const controlWidth = typeof width === 'number' ? `min(${width}px, calc(100vw - 32px))` : width;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="track-combobox-trigger"
          style={{
            width: controlWidth,
            maxWidth: '100%',
            height: 34,
            padding: '0 10px',
            borderRadius: 8,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--surface))',
            color: 'hsl(var(--text-title))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: displayColor,
                flexShrink: 0,
              }}
            />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayLabel}
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {onCreateTrack && arrValue.length > 0 && (
              <span style={{ fontSize: 10, color: atLimit ? 'hsl(var(--destructive))' : 'hsl(var(--text-muted))', fontWeight: 600 }}>
                {arrValue.length}/{MAX_TRACKS}
              </span>
            )}
            <ChevronDown size={14} style={{ color: 'hsl(var(--text-meta))', flexShrink: 0 }} />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="p-0 track-combobox-content" style={{ width: controlWidth }}>
        <Command>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={onCreateTrack ? 'Search or create a track...' : 'Search tracks...'}
          />
          <CommandList>
            <CommandEmpty style={{ padding: '12px 10px', fontSize: 12, color: 'hsl(var(--text-meta))' }}>
              {showCreate ? 'No matching track yet. Create it below.' : 'No tracks found.'}
            </CommandEmpty>

            {allLabel && (
              <CommandGroup heading="Filter">
                <CommandItem value={allLabel} onSelect={() => handleSelect(null)}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'hsl(var(--text-meta))',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{allLabel}</span>
                  {arrValue.length === 0 && <Check size={14} style={{ color: 'hsl(var(--primary))' }} />}
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup heading="Tracks">
              {tracks.map(track => {
                const isSelected = arrValue.includes(track);
                const isDisabled = atLimit && !isSelected;
                return (
                  <CommandItem
                    key={track}
                    value={track}
                    onSelect={() => !isDisabled && handleSelect(track)}
                    style={{ opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: getTrackColor(track),
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ flex: 1 }}>{track}</span>
                    {isSelected && <Check size={14} style={{ color: 'hsl(var(--primary))' }} />}
                    {isDisabled && <span style={{ fontSize: 10, color: 'hsl(var(--text-muted))' }}>limit</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {showCreate && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Create">
                  <CommandItem value={`create-${trimmedQuery}`} onSelect={handleCreate}>
                    <Plus size={14} style={{ color: 'hsl(var(--primary))' }} />
                    <span style={{ flex: 1 }}>Create "{trimmedQuery}"</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

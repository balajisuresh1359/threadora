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

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
  };

  const handleCreate = () => {
    if (!trimmedQuery || !onCreateTrack) return;
    onCreateTrack(trimmedQuery);
    onChange(trimmedQuery.trim());
    setOpen(false);
    setQuery('');
  };

  const showCreate = Boolean(onCreateTrack && trimmedQuery && !hasExactMatch);
  const displayLabel = value || allLabel || placeholder;
  const displayColor = value ? getTrackColor(value) : 'hsl(var(--text-meta))';

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
          style={{
            width,
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
          <ChevronDown size={14} style={{ color: 'hsl(var(--text-meta))', flexShrink: 0 }} />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="p-0" style={{ width }}>
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
                  {!value && <Check size={14} style={{ color: 'hsl(var(--primary))' }} />}
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup heading="Tracks">
              {tracks.map(track => (
                <CommandItem key={track} value={track} onSelect={() => handleSelect(track)}>
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
                  {value === track && <Check size={14} style={{ color: 'hsl(var(--primary))' }} />}
                </CommandItem>
              ))}
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

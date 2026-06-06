/**
 * Relative time display utilities for Threadora.
 * Updates every 60 seconds via a useRelativeTime hook.
 */

export function getRelativeTime(isoString) {
  if (!isoString) return 'unknown';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then; // ms

  if (diff < 0) return 'just now';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 30) return 'just now';
  if (seconds < 90) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  return `${Math.floor(days / 7)} weeks ago`;
}

export function getElapsedTime(isoString) {
  if (!isoString) return '';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) return 'less than a minute';
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

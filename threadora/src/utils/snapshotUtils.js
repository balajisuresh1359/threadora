function cleanText(value) {
  return value?.trim() || '';
}

export function getSnapshotHandoff(snap, status) {
  if (!snap || snap.type !== 'snapshot') return null;

  const nextStep = cleanText(snap.nextStep);
  const blocker = cleanText(snap.blocker);
  const normalizedStatus = status || snap.targetStatus || 'paused';

  if (normalizedStatus === 'stuck') {
    if (snap.targetStatus === 'stuck' && nextStep) {
      return { label: 'Reason', value: nextStep };
    }
    if (blocker) {
      return { label: 'Reason', value: blocker };
    }
    if (nextStep) {
      return { label: 'Next', value: nextStep };
    }
    return null;
  }

  if (nextStep) {
    return { label: 'Next', value: nextStep };
  }

  if (blocker) {
    return { label: 'Next', value: blocker };
  }

  return null;
}

export function buildSnapshotCopyText(snap, status) {
  if (!snap) return '';

  if ((snap.type === 'context_note' || snap.type === 'resume_note') && snap.note) {
    return snap.note;
  }

  if (snap.type !== 'snapshot') return '';

  const lines = [];
  const context = cleanText(snap.lastAction);
  const handoff = getSnapshotHandoff(snap, status);
  const blocker = cleanText(snap.blocker);

  if (context) {
    lines.push(`Context: ${context}`);
  }

  if (handoff) {
    lines.push(`${handoff.label}: ${handoff.value}`);
  }

  if (blocker && (!handoff || handoff.value !== blocker)) {
    lines.push(`Blocker: ${blocker}`);
  }

  return lines.join('\n');
}

// Curated work-safe emoji set for auto-assignment
export const WORK_EMOJIS = [
  '🧤', '📝', '✏️', '💡', '🧠', '🎯', '⚡', '🔥', '🌱', '✨',
  '💻', '🔧', '🐞', '🧪', '⚙️', '🤖', '🔒', '🛡️', '📡', '🌐',
  '🔍', '🔬', '📊', '📈', '🧮', '📍', '🔭', '🧭', '🧲', '🪐',
  '💬', '🤝', '📎', '🔗', '📌', '📚', '🎨', '📐', '🪄', '🧩',
  '📦', '🏗️', '🚀', '🏁', '🧱', '🧰', '🪛', '🪜', '📋', '🧵',
  '🗂️', '🗃️', '🔑', '📈', '📉', '🛰️', '🧫', '🧬', '🦾', '🧯',
  '🌟', '❄️', '🍀', '🦉', '🐝', '🐢', '👾', '🕹️', '🪙', '🧿'
];

export function getRandomWorkEmoji() {
  return WORK_EMOJIS[Math.floor(Math.random() * WORK_EMOJIS.length)];
}

// src/utils/messages.js

// Trust-building, role-aware, varied messages
const divorceeMessages = [
  (name) => `Welcome, ${name}. This path can feel heavy, but you don't have to carry it alone. We'll walk it with you—step by step.`,
  (name) => `${name}, your story matters here. We'll keep things respectful, calm, and focused on what truly helps you and your family.`,
  (name) => `You're in a safe place, ${name}. We’ll guide the process so it stays structured, fair, and as gentle as possible.`,
  (name) => `Welcome${name ? `, ${name}` : ''}. We’re here to help you make clear decisions with care and dignity.`,
];

const mediatorMessages = [
  (name) => `Welcome, ${name}. Your neutrality creates space for resolution—we’re here to support your professional integrity.`,
  (name) => `${name}, our tools help you stay organized and impartial while moving families toward agreement.`,
  (name) => `Good to see you${name ? `, ${name}` : ''}. We'll help you keep the process steady, documented, and balanced.`,
];

const lawyerMessages = [
  (name) => `Welcome, ${name}. Keep visibility over your client's progress while we help maintain structure and fairness.`,
  (name) => `${name}, you'll have clarity on status, documents, and next steps—without compromising neutrality.`,
  (name) => `Hello${name ? `, ${name}` : ''}. We aim to reduce friction while ensuring due process for your clients.`,
];

const adminMessages = [
  (name) => `Welcome, ${name}. Compliance and coordination are easier here—thank you for keeping things running smoothly.`,
  (name) => `${name}, your oversight keeps cases on track. We'll help with consistency, records, and reporting.`,
  (name) => `Good to have you${name ? `, ${name}` : ''}. We've got your back on process, checkpoints, and notifications.`,
];

const roleMessages = {
  divorcee: divorceeMessages,
  mediator: mediatorMessages,
  lawyer: lawyerMessages,
  admin: adminMessages,
};

function pick(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getRandomMessage(role, name) {
  const messages = roleMessages[role] || divorceeMessages;
  return pick(messages)(name || 'there');
}

// Personalized welcome with "welcome back" when returning
export function getPersonalWelcome({ role = 'divorcee', name = 'there' } = {}) {
  const seenKey = 'accord_seen_welcome';
  const hasSeen = localStorage.getItem(seenKey) === '1';
  const welcomeLead = hasSeen ? `Welcome back${name ? `, ${name}` : ''}.` : `Welcome${name ? `, ${name}` : ''}.`;
  // Rotate a role-aware trust message
  const tail = getRandomMessage(role, name);
  // Mark seen to avoid repeating the same lead each time
  if (!hasSeen) localStorage.setItem(seenKey, '1');
  return `${welcomeLead} ${tail}`;
}

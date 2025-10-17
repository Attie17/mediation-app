// Session modes for the divorce-wizard and related flows
export const SESSION_MODES = [
  'individual',
  'joint',
  'mediation',
  'collaborative',
  'court',
] as const;

export type SessionMode = typeof SESSION_MODES[number];

// Example: participant type
export interface Participant {
  id: string;
  name: string;
  role: 'divorcee' | 'mediator' | 'lawyer' | 'admin';
}

// Add other shared types/constants as needed

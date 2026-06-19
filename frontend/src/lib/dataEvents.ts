export const DATA_EVENTS = {
  documentsChanged: 'sonicsign:documents-changed',
  profileChanged: 'sonicsign:profile-changed',
} as const;

export function emitDataEvent(eventName: (typeof DATA_EVENTS)[keyof typeof DATA_EVENTS]) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(eventName));
  }
}

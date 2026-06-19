/**
 * Maps Firebase Auth error codes/messages to user-friendly display messages.
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = error.message || '';

  // Helper to check if a specific code or substring is present
  const matches = (target: string) => {
    return code === target || message.includes(target);
  };

  if (matches('auth/invalid-credential') || matches('auth/user-not-found') || matches('auth/wrong-password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (matches('auth/email-already-in-use')) {
    return 'This email address is already registered. Please sign in instead.';
  }
  if (matches('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (matches('auth/weak-password')) {
    return 'The password is too weak. Please use a stronger password (at least 6 characters).';
  }
  if (matches('auth/user-disabled')) {
    return 'This account has been disabled. Please contact support.';
  }
  if (matches('auth/too-many-requests')) {
    return 'Too many failed login attempts. Please wait a moment and try again.';
  }
  if (matches('auth/popup-closed-by-user')) {
    return 'Sign-in window closed. Please try again.';
  }
  if (matches('auth/operation-not-allowed')) {
    return 'This sign-in method is not enabled. Please contact support.';
  }
  if (matches('auth/network-request-failed')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Fallback to standard message, cleaning up the "Firebase:" prefix if it exists
  if (message.startsWith('Firebase:')) {
    return message
      .replace(/^Firebase:\s*Error\s*\((auth\/[^)]+)\)\.?\s*/i, '') // strip "Firebase: Error (auth/invalid-credential)."
      .replace(/^Firebase:\s*/i, '')
      .trim();
  }

  return error instanceof Error ? error.message : 'An error occurred during authentication. Please try again.';
}

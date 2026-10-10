export type UserId = 'blair' | 'scott';

export const USERS: Record<UserId, { id: UserId; displayName: string; label: string }> = {
  blair: { id: 'blair', displayName: 'Blair', label: "Dad (Blair)" },
  scott: { id: 'scott', displayName: 'Scott', label: 'Scott' },
};

export const DEFAULT_USER: UserId = 'blair';
export const ACTIVE_USER_KEY = 'memorandom_active_user';

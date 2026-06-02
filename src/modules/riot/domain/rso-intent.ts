export type RsoIntent = 'login' | 'register';

export const RSO_INTENT_ERROR = {
  USER_NOT_FOUND: 'user_not_found',
  USER_ALREADY_EXISTS: 'user_already_exists',
} as const;

export type RsoIntentErrorCode =
  (typeof RSO_INTENT_ERROR)[keyof typeof RSO_INTENT_ERROR];

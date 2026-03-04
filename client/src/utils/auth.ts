const TOKEN_KEY = "shadow_me_token";
const EMAIL_KEY = "shadow_me_email";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void =>
  localStorage.setItem(TOKEN_KEY, token);

export const getEmail = (): string | null => localStorage.getItem(EMAIL_KEY);
export const setEmail = (email: string): void =>
  localStorage.setItem(EMAIL_KEY, email);

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
};

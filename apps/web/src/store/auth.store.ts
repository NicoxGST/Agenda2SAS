import {
  useSyncExternalStore,
} from 'react';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
};

const STORAGE_KEY =
  'agenda_auth';

const listeners =
  new Set<
    () => void
  >();

function emit() {
  listeners.forEach(
    (listener) =>
      listener(),
  );
}

function subscribe(
  listener: () => void,
) {
  listeners.add(
    listener,
  );

  return () =>
    listeners.delete(
      listener,
    );
}

function getStoredAuth(): AuthState {

  const raw =
    localStorage.getItem(
      STORAGE_KEY,
    );

  if (!raw) {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
    };
  }

  try {

    const parsed =
      JSON.parse(raw);

    return {
      accessToken:
        parsed.accessToken,

      refreshToken:
        parsed.refreshToken,

      user:
        parsed.user ?? null,
    };

  } catch {

    return {
      user: null,
      accessToken: null,
      refreshToken: null,
    };
  }
}

let authState =
  getStoredAuth();

export function getAuth() {
  return authState;
}

export function useAuth() {
  return useSyncExternalStore(
    subscribe,
    () => authState,
  );
}

export function logout() {
  localStorage.removeItem(
    STORAGE_KEY,
  );

  authState = {
    accessToken: null,
    refreshToken: null,
    user: null,
  };

  emit();
}

export function setAuth(
  accessToken: string,
  refreshToken: string,
  user: User,
) {

  authState = {
    accessToken,
    refreshToken,
    user,
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(authState),
  );

  emit();
}
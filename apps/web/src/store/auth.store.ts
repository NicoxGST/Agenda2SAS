import {
  useSyncExternalStore,
} from 'react';

type User = {
  id: number;
  email: string;
  role: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
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

function parseJwt(
  token: string,
) {
  const payload =
    token.split('.')[1];

  const decoded =
    JSON.parse(
      atob(payload),
    );

  return {
    id: decoded.sub,
    email:
      decoded.email,
    role:
      decoded.role,
  };
}

function getStoredAuth(): AuthState {
  const token =
    localStorage.getItem(
      STORAGE_KEY,
    );

  if (!token) {
    return {
      user: null,
      token: null,
    };
  }

  return {
    token,
    user:
      parseJwt(
        token,
      ),
  };
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

export function login(
  token: string,
) {
  localStorage.setItem(
    STORAGE_KEY,
    token,
  );

  authState = {
    token,
    user:
      parseJwt(
        token,
      ),
  };

  emit();
}

export function logout() {
  localStorage.removeItem(
    STORAGE_KEY,
  );

  authState = {
    token: null,
    user: null,
  };

  emit();
}
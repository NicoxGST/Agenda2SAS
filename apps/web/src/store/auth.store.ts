type AuthUser = {
  email: string;
  role: string;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
};

const STORAGE_KEY =
  'agenda_auth';

export const authStore = {

  get(): AuthState {

    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return {
        accessToken: null,
        user: null,
      };
    }

    return JSON.parse(raw);
  },

  set(data: AuthState) {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data),
    );
  },

  clear() {

    localStorage.removeItem(
      STORAGE_KEY,
    );
  },

  isAuthenticated() {

    return !!this.get()
      .accessToken;
  },
};
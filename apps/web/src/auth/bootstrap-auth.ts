import { getAuth, setAuth, logout, } from '../store/auth.store';

import { refreshSession, getMe, } from '../services/auth.service';

export async function bootstrapAuth() {

  const auth =
    getAuth();

  if (
    !auth.accessToken ||
    !auth.refreshToken
  ) {
    return;
  }

  try {

    const user =
      await getMe(
        auth.accessToken,
      );

    setAuth(
      auth.accessToken,
      auth.refreshToken,
      user,
    );

  } catch {

    try {

      const tokens =
        await refreshSession(
          auth.refreshToken,
        );

      const user =
        await getMe(
          tokens.accessToken,
        );

      setAuth(
        tokens.accessToken,
        tokens.refreshToken,
        user,
      );

    } catch {

      logout();
    }
  }
}
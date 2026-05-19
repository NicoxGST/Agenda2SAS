import { Navigate } from 'react-router-dom';

import {
  useAuth,
} from '../../store/auth.store';

type Props = {
  allowedRoles: string[];
  children: React.ReactNode;
};

export function RouteGuard({
  allowedRoles,
  children,
}: Props) {

  const auth =
    useAuth();

  const user =
    auth.user;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    !allowedRoles.includes(
      user.role,
    )
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}
type JwtPayload = {
  email: string;
  role: string;
  sub: number;
};

export function parseJwt(
  token: string,
): JwtPayload {

  const payload =
    token.split('.')[1];

  const decoded =
    atob(payload);

  return JSON.parse(
    decoded,
  );
}
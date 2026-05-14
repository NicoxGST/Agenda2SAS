import {
  Link,
} from 'react-router-dom';

export function Navbar() {
  return (
    <nav>
      <Link to="/">
        Inicio
      </Link>

      {' | '}

      <Link to="/login">
        Login
      </Link>

      {' | '}

      <Link to="/register">
        Registro
      </Link>
    </nav>
  );
}
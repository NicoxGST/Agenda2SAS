import { Outlet } from 'react-router-dom';

import { Navbar } from '../components/layout/Navbar';

export function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}

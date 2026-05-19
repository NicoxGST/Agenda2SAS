import { Outlet } from 'react-router-dom';

import { Navbar } from '../components/layout/Navbar';

export function MainLayout() {
  return (
    <>
      <Navbar />

      <Outlet />
    </>
  );
}
import { ROLES } from "../constants/roles";

export type NavEntry = {
  to: string;
  label: string;
  navbarLabel?: string;
  end?: boolean;
  showInNavbar?: boolean;
};

const clientNav: NavEntry[] = [
  { to: "/client",    label: "Mi Panel",   end: true, showInNavbar: true },
  { to: "/servicios", label: "Servicios" },
  { to: "/productos", label: "Productos" },
];

const workerNav: NavEntry[] = [
  { to: "/worker",      label: "Mi Agenda",          end: true, showInNavbar: true },
  { to: "/worker/jobs", label: "Mis Trabajos",       showInNavbar: true },
  { to: "/ordenes",     label: "Órdenes de trabajo", navbarLabel: "Órdenes", showInNavbar: true },
];

const adminNav: NavEntry[] = [
  { to: "/admin",           label: "Dashboard",         navbarLabel: "Panel Admin", end: true, showInNavbar: true },
  { to: "/users",           label: "Usuarios" },
  { to: "/admin/servicios", label: "Servicios" },
  { to: "/admin/productos", label: "Productos" },
  { to: "/worker",          label: "Agenda",            showInNavbar: true },
  { to: "/ordenes",         label: "Órdenes de trabajo" },
];

export const roleNavMap: Record<string, NavEntry[]> = {
  [ROLES.CLIENT]:      clientNav,
  [ROLES.WORKER]:      workerNav,
  [ROLES.ADMIN]:       adminNav,
  [ROLES.SUPER_ADMIN]: adminNav,
};

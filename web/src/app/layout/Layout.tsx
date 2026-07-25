import { NavLink, Outlet } from "react-router-dom";

/**
 * One entry in the sidebar navigation.
 * "to" is the route path, "label" is what's shown to the user.
 */
const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/students", label: "Students" },
  { to: "/staff", label: "Staff" },
  { to: "/attendance", label: "Attendance" },
  { to: "/fees", label: "Fees" },
];

/**
 * App shell: sidebar on the left, topbar across the top, and whichever
 * page is currently routed rendered in the middle via <Outlet />.
 *
 * <Outlet /> is react-router's placeholder for "render the matched child
 * route here" — so Layout only needs to be written once, and every page
 * (Dashboard, Students, Staff, ...) automatically gets the same sidebar
 * and topbar around it.
 */
export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">CampusCore</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              // NavLink gives us isActive so we can highlight the current page.
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <span className="topbar-school-name">Greenwood High School</span>
          <div className="topbar-user">
            <span className="topbar-user-avatar">A</span>
            <span className="topbar-user-name">Admin</span>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

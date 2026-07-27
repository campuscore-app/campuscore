import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearSchoolName, getToken, getSchoolName } from "../../shared/auth/tokenStorage";
import { getEmailFromToken } from "../../shared/auth/jwt";
import {
  DashboardIcon,
  StudentsIcon,
  StaffIcon,
  AttendanceIcon,
  FeesIcon,
  ChevronDownIcon,
  LogoutIcon,
} from "../../shared/components/icons";

/**
 * One entry in the sidebar navigation.
 * "to" is the route path, "label" is what's shown to the user.
 */
const navItems = [
  { to: "/", label: "Dashboard", end: true, Icon: DashboardIcon },
  { to: "/students", label: "Students", end: false, Icon: StudentsIcon },
  { to: "/staff", label: "Staff", end: false, Icon: StaffIcon },
  { to: "/attendance", label: "Attendance", end: false, Icon: AttendanceIcon },
  { to: "/fees", label: "Fees", end: false, Icon: FeesIcon },
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
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const token = getToken();
  const email = token ? getEmailFromToken(token) : null;
  const schoolName = getSchoolName();

  function handleLogout() {
    clearToken();
    clearSchoolName();
    navigate("/login", { replace: true });
  }

  // Closes the dropdown on an outside click, so it behaves like every
  // other menu in the app instead of staying open until Log out is clicked.
  useEffect(() => {
    if (!isUserMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">CampusCore</div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              // NavLink gives us isActive so we can highlight the current page.
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              <span className="sidebar-link-icon">
                <Icon />
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <span className="topbar-school-name">{schoolName ?? "CampusCore"}</span>

          <div className="user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="user-menu-trigger"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              aria-expanded={isUserMenuOpen}
            >
              <span className="topbar-user-avatar">{email ? email[0].toUpperCase() : "A"}</span>
              <span className="topbar-user-name">{email ?? "Admin"}</span>
              <ChevronDownIcon
                className={isUserMenuOpen ? "user-menu-chevron user-menu-chevron-open" : "user-menu-chevron"}
              />
            </button>

            {isUserMenuOpen && (
              <div className="user-menu-dropdown">
                <div className="user-menu-email">{email ?? "Signed in"}</div>
                <button type="button" className="user-menu-item user-menu-item-danger" onClick={handleLogout}>
                  <LogoutIcon width={16} height={16} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

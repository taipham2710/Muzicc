import { useState, useRef, useEffect } from "react";
import { Navigate, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { useAudioStore } from "../stores/audio.store";
import GlobalAudioPlayer from "../components/GlobalAudioPlayer";
import ToastContainer from "../components/ToastContainer";

const navItems = [
  { path: "/home", label: "Home" },
  { path: "/my-music", label: "My Music" },
];

export default function AuthLayout() {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const stopAudio = useAudioStore((s) => s.stop);

  function handleLogout() {
    setDropdownOpen(false);
    logout();
    navigate("/login");
  }

  function handleMuziccClick(e: React.MouseEvent) {
    e.preventDefault();
    stopAudio();
    window.location.href = "/home";
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 24px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-elevated)",
          flexShrink: 0,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <a
          href="/home"
          onClick={handleMuziccClick}
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text)",
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          Muzicc
        </a>

        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="avatar-btn"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "none",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
            aria-label="Account menu"
          >
            👤
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 8,
                minWidth: 200,
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                padding: "6px 0",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Account
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="dropdown-item"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  color: "var(--text)",
                  fontSize: 14,
                  textAlign: "left",
                  cursor: "pointer",
                  borderRadius: 0,
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            backgroundColor: "var(--bg-base)",
            padding: "20px 0",
          }}
        >
          <nav>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="nav-link"
                  style={{
                    display: "block",
                    padding: "12px 24px",
                    margin: "0 8px",
                    color: isActive ? "var(--text)" : "var(--text-secondary)",
                    textDecoration: "none",
                    fontSize: 15,
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? "var(--bg-surface)" : "transparent",
                    borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main
          style={{
            flex: 1,
            padding: 28,
            paddingBottom: 120,
            overflowY: "auto",
            minWidth: 0,
            backgroundColor: "var(--bg-base)",
          }}
        >
          <Outlet />
        </main>
      </div>

      <GlobalAudioPlayer />
      <ToastContainer />
    </div>
  );
}

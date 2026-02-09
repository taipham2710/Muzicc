import { Navigate, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import GlobalAudioPlayer from "../components/GlobalAudioPlayer";

export default function AuthLayout() {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          borderBottom: "1px solid #444",
        }}
      >
        <Link to="/home" style={{ fontSize: 20, fontWeight: "bold" }}>
          Muzicc
        </Link>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span>User</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Page content */}
      <main style={{ padding: 24, paddingBottom: 100 }}>
        <Outlet />
      </main>

      {/* Global Audio Player */}
      <GlobalAudioPlayer />
    </div>
  );
}

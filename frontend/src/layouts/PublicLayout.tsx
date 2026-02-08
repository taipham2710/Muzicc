import { Link, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid #eee",
        }}
      >
        {/* Left: App name */}
        <Link to="/" style={{ fontSize: 20, fontWeight: 600 }}>
          Muzicc
        </Link>

        {/* Right: Auth actions */}
        <div style={{ display: "flex", gap: 16 }}>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Sign up</Link>
        </div>
      </header>

      {/* Page content */}
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}

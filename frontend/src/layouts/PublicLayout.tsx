import { Link, Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import ToastContainer from "../components/ToastContainer";
import GlobalAudioPlayer from "../components/GlobalAudioPlayer";
import { useAudioStore } from "../stores/audio.store";

export default function PublicLayout() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const isRegister = location.pathname === "/register";
  const stopAudio = useAudioStore((s) => s.stop);

  const handleMuziccClick = (e: React.MouseEvent) => {
    e.preventDefault();
    stopAudio();
    window.location.href = "/";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-base)",
        color: "var(--text)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-elevated)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <a
          href="/"
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

        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link
            to="/login"
            style={{
              color: isLogin ? "var(--primary)" : "var(--text-secondary)",
              textDecoration: "none",
              fontSize: 15,
              fontWeight: isLogin ? 600 : 500,
            }}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            style={{
              color: isRegister ? "var(--primary)" : "var(--text-secondary)",
              textDecoration: "none",
              fontSize: 15,
              fontWeight: isRegister ? 600 : 500,
            }}
          >
            Sign up
          </Link>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: 28,
          paddingBottom: 120, // chừa chỗ cho GlobalAudioPlayer để không che nội dung cuối
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <Outlet />
      </main>

      <GlobalAudioPlayer />
      <ToastContainer />
    </div>
  );
}

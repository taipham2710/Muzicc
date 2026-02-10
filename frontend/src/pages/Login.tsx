import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth.store";

const formStyle: React.CSSProperties = {
  maxWidth: 360,
  margin: "0 auto",
  padding: 24,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 500,
  color: "var(--text-secondary)",
};

const inputStyle: React.CSSProperties = {
  marginBottom: 16,
};

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.access_token);
      navigate("/home");
    } catch (err: unknown) {
      const isNetworkError =
        err != null &&
        typeof err === "object" &&
        "message" in err &&
        (err as { message?: string }).message === "Network Error";
      const hasNoResponse =
        err != null &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: unknown }).response == null;

      if (isNetworkError || hasNoResponse) {
        setError("Không thể kết nối server. Kiểm tra backend đã chạy chưa (port 8000).");
      } else {
        setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={formStyle}>
      <h1 className="page-title" style={{ fontSize: "1.75rem" }}>Sign in</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 28 }}>
        Đăng nhập để nghe nhạc và quản lý bài hát của bạn.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle} htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
          className="input-field"
          style={inputStyle}
        />

        <label style={labelStyle} htmlFor="login-password">Mật khẩu</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
          className="input-field"
          style={inputStyle}
        />

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16 }}>{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: 12, fontSize: 15 }}>
          {loading ? "Đang đăng nhập..." : "Sign in"}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 14, color: "var(--text-secondary)" }}>
        Chưa có tài khoản?{" "}
        <Link to="/register" style={{ color: "var(--primary)", fontWeight: 500 }}>Sign up</Link>
      </p>
    </div>
  );
}

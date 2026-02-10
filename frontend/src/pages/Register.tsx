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

const inputStyle: React.CSSProperties = { marginBottom: 16 };

export default function Register() {
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
      await api.post("/auth/register", { email, password });
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
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data
                ?.detail
            : null;
        setError(
          msg && typeof msg === "string"
            ? msg
            : "Đăng ký thất bại. Email có thể đã được sử dụng."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={formStyle}>
      <h1 className="page-title" style={{ fontSize: "1.75rem" }}>Sign up</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 28 }}>
        Tạo tài khoản để upload và quản lý bài hát.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle} htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
          className="input-field"
          style={inputStyle}
        />

        <label style={labelStyle} htmlFor="register-password">Mật khẩu</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="new-password"
          className="input-field"
          style={inputStyle}
        />

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16 }}>{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: 12, fontSize: 15 }}>
          {loading ? "Đang đăng ký..." : "Sign up"}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 14, color: "var(--text-secondary)" }}>
        Đã có tài khoản?{" "}
        <Link to="/login" style={{ color: "var(--primary)", fontWeight: 500 }}>Sign in</Link>
      </p>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth.store";

export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore((state: any) => state.login);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
        const res = await api.post("/auth/login", {
            email,
            password,
        });

        login(res.data.access_token);
        navigate("/home");
        } catch (err: any) {
        setError("Email hoặc mật khẩu không đúng");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div>
        <h1>Sign in</h1>

        <form onSubmit={handleSubmit}>
            <div>
            <label>Email</label>
            <br />
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            </div>

            <div>
            <label>Password</label>
            <br />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
            </button>
        </form>

        <p>
            Chưa có tài khoản? <a href="/register">Sign up</a>
        </p>
        </div>
    );
    }

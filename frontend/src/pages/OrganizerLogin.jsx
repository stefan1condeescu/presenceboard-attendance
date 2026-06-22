import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function OrganizerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const isValid = email.trim() && password.trim();

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    try {
      setSubmitting(true);
      const res = await api.post("/organizers/login", {
        email: email.trim(),
        password: password.trim(),
      });

      if (!res?.token) {
        throw new Error("Sign in failed.");
      }

      localStorage.setItem("token", res.token);

      if (res.organizer) {
        localStorage.setItem("organizer", JSON.stringify(res.organizer));
      }

      navigate("/organizer/dashboard");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <section className="auth-shell">
        <div className="auth-copy">
          <p className="eyebrow">Organizer access</p>
          <h1 className="section-title">Sign in</h1>
          <p className="section-subtitle">Manage event groups, live check-ins, and CSV exports.</p>
        </div>

        <form className="card form-card" onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="form-actions">
            <Link to="/organizer/register" className="btn btn-muted">
              Create account
            </Link>

            <button className="btn btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </div>

          {message && <div className="alert alert-error">{message}</div>}
        </form>
      </section>
    </Layout>
  );
}
